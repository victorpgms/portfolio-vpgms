const GITHUB_USER = "victorpgms";
const MAX_PROJETOS_RECENTES = 9;
const GITHUB_CACHE_TTL = 15 * 60 * 1000;
const GITHUB_CACHE_PREFIX = "portfolio-github-cache:";


const PROJETOS_PRINCIPAIS = [
    {
        usuario: "victorpgms",
        repositorio: "blogpessoal_react",
        imagem: "https://ik.imagekit.io/vpgms/BlogPessoal/projetos%20principais/Captura%20de%20tela%202026-08-31%201819392.png",
    },
    {
        usuario: "VidaConecta",
        repositorio: "conectatravel_react",
        imagem: "https://ik.imagekit.io/vpgms/VidaConecta/ConectaTravel/print-login.png",
    },
    {
        usuario: "victorpgms",
        repositorio: "projeto-fintech",
        imagem: "https://ik.imagekit.io/vpgms/BlogPessoal/projetos%20principais/Captura%20de%20tela%202026-08-31%20205907.png",
    },
    
    {
        usuario: "victorpgms",
        repositorio: "gerar-qr-code",
        imagem: "https://ik.imagekit.io/vpgms/BlogPessoal/projetos%20principais/Captura%20de%20tela%202026-08-31%20204007.png?updatedAt=1788219673528",
    },
];

const ICONES_LINGUAGENS = {
    JavaScript: "javascript",
    TypeScript: "typescript",
    Python: "python",
    Java: "java",
    HTML: "html",
    CSS: "css",
    PHP: "php",
    "C#": "csharp",
    Go: "go",
    Kotlin: "kotlin",
    Swift: "swift",
    C: "c",
    "C++": "c_plus",
    GitHub: "github",
};

const featuredContainer = document.querySelector("#featured-projects");
const swiperWrapper = document.querySelector(".projects-swiper .swiper-wrapper");
const formulario = document.querySelector("#formulario");
const themeToggle = document.querySelector(".theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let projectsSwiper;

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function truncar(texto = "", limite = 115) {
    return texto.length > limite
        ? `${texto.substring(0, limite).trim()}…`
        : texto;
}

function formatarNome(nome = "") {
    return nome
        .replace(/[-_]/g, " ")
        .replace(/\s+t[a-z0-9]+$/i, "")
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function getLanguageIcon(linguagem = "GitHub") {
    const iconName =
        ICONES_LINGUAGENS[linguagem] || ICONES_LINGUAGENS.GitHub;

    return `./assets/icons/languages/${iconName}.svg`;
}

function getTags(repositorio, limite = 3) {
    const topics = Array.isArray(repositorio.topics)
        ? repositorio.topics.slice(0, limite)
        : [];
    const tags = topics.length
        ? topics
        : [repositorio.language || "GitHub"];

    return tags
        .map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`)
        .join("");
}

function formatarData(data) {
    if (!data) return "Recente";

    return new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "numeric",
    })
        .format(new Date(data))
        .replace(".", "");
}

function getGitHubCache(url) {
    try {
        const cachedValue = localStorage.getItem(`${GITHUB_CACHE_PREFIX}${url}`);
        if (!cachedValue) return null;

        const cached = JSON.parse(cachedValue);
        if (!cached?.timestamp || !cached?.data) return null;

        return {
            data: cached.data,
            isFresh: Date.now() - cached.timestamp < GITHUB_CACHE_TTL,
        };
    } catch (error) {
        return null;
    }
}

function setGitHubCache(url, data) {
    try {
        localStorage.setItem(
            `${GITHUB_CACHE_PREFIX}${url}`,
            JSON.stringify({ timestamp: Date.now(), data }),
        );
    } catch (error) {
        console.warn("Não foi possível armazenar o cache do GitHub.");
    }
}

async function fetchGitHub(url) {
    const cached = getGitHubCache(url);
    if (cached?.isFresh) return cached.data;

    try {
        const resposta = await fetch(url, {
            headers: {
                Accept: "application/vnd.github+json",
            },
        });

        if (!resposta.ok) {
            throw new Error(`GitHub respondeu com status ${resposta.status}`);
        }

        const data = await resposta.json();
        setGitHubCache(url, data);
        return data;
    } catch (error) {
        if (cached?.data) {
            console.warn("Usando dados salvos do GitHub.", error);
            return cached.data;
        }

        throw error;
    }
}

function updateThemeButton(theme) {
    if (!themeToggle) return;

    const isDark = theme === "dark";
    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Ativar modo claro" : "Ativar modo escuro",
    );
    themeToggle.title = isDark ? "Ativar modo claro" : "Ativar modo escuro";

    if (themeColor) {
        themeColor.content = isDark ? "#111110" : "#f7f7f5";
    }
}

function initializeTheme() {
    const activeTheme = document.documentElement.dataset.theme || "light";
    updateThemeButton(activeTheme);

    themeToggle?.addEventListener("click", () => {
        const nextTheme =
            document.documentElement.dataset.theme === "dark"
                ? "light"
                : "dark";

        document.documentElement.dataset.theme = nextTheme;
        updateThemeButton(nextTheme);

        try {
            localStorage.setItem("portfolio-theme", nextTheme);
        } catch (error) {
            console.warn("Não foi possível salvar a preferência de tema.");
        }
    });
}

function initializePointerTrail() {
    if (reduceMotion.matches) return;

    const trail = document.createElement("div");
    trail.className = "pointer-trail";
    trail.setAttribute("aria-hidden", "true");

    const dots = Array.from({ length: 12 }, (_, index) => {
        const dot = document.createElement("span");
        dot.className = "pointer-trail__dot";
        dot.style.width = `${Math.max(5, 9 - index * 0.25)}px`;
        dot.style.height = dot.style.width;
        trail.appendChild(dot);
        return dot;
    });

    document.body.appendChild(trail);

    let dotIndex = 0;
    let lastX = -100;
    let lastY = -100;
    let lastTime = 0;

    window.addEventListener(
        "pointermove",
        (event) => {
            if (!event.isPrimary) return;

            const now = performance.now();
            const distance = Math.hypot(
                event.clientX - lastX,
                event.clientY - lastY,
            );

            if (distance < 11 && now - lastTime < 36) return;

            const dot = dots[dotIndex];
            dotIndex = (dotIndex + 1) % dots.length;
            lastX = event.clientX;
            lastY = event.clientY;
            lastTime = now;

            dot.getAnimations().forEach((animation) => animation.cancel());
            dot.style.left = `${event.clientX}px`;
            dot.style.top = `${event.clientY}px`;

            dot.animate(
                [
                    {
                        opacity: event.pointerType === "touch" ? 0.3 : 0.38,
                        transform: "translate(-50%, -50%) scale(1)",
                    },
                    {
                        opacity: 0,
                        transform: "translate(-50%, -50%) scale(0.2)",
                    },
                ],
                {
                    duration: event.pointerType === "touch" ? 820 : 620,
                    easing: "cubic-bezier(0.16, 0.7, 0.3, 1)",
                    fill: "forwards",
                },
            );
        },
        { passive: true },
    );
}

function initializeHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 12);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
}

function initializeNavigation() {
    const header = document.querySelector(".site-header");
    const navigation = document.querySelector("#main-navigation");
    const navigationToggle = document.querySelector(".nav-toggle");

    if (!header || !navigation || !navigationToggle) return;

    const closeNavigation = ({ restoreFocus = false } = {}) => {
        header.classList.remove("menu-open");
        navigationToggle.setAttribute("aria-expanded", "false");
        navigationToggle.setAttribute("aria-label", "Abrir menu");

        if (restoreFocus) navigationToggle.focus();
    };

    navigationToggle.addEventListener("click", () => {
        const willOpen = !header.classList.contains("menu-open");
        header.classList.toggle("menu-open", willOpen);
        navigationToggle.setAttribute("aria-expanded", String(willOpen));
        navigationToggle.setAttribute(
            "aria-label",
            willOpen ? "Fechar menu" : "Abrir menu",
        );
    });

    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeNavigation();
    });

    document.addEventListener("click", (event) => {
        if (!header.contains(event.target)) closeNavigation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && header.classList.contains("menu-open")) {
            closeNavigation({ restoreFocus: true });
        }
    });

    const mobileNavigation = window.matchMedia("(max-width: 52rem)");
    const handleBreakpointChange = () => closeNavigation();

    if (typeof mobileNavigation.addEventListener === "function") {
        mobileNavigation.addEventListener("change", handleBreakpointChange);
    } else {
        mobileNavigation.addListener(handleBreakpointChange);
    }
}

async function getAboutGitHub() {
    const avatar = document.querySelector("#profile-avatar");
    const profileLink = document.querySelector("#github-profile-link");
    const repositoriesCount = document.querySelector("#repositories-count");
    const followersCount = document.querySelector("#followers-count");

    if (!avatar && !repositoriesCount && !followersCount) return;

    try {
        const perfil = await fetchGitHub(
            `https://api.github.com/users/${GITHUB_USER}`,
        );

        if (avatar && perfil.avatar_url) {
            avatar.src = perfil.avatar_url;
            avatar.alt = `Foto de perfil de ${perfil.name || "Victor Pedro"}`;
        }

        if (profileLink && perfil.html_url) {
            profileLink.href = perfil.html_url;
        }

        if (repositoriesCount) {
            repositoriesCount.textContent = perfil.public_repos ?? "—";
        }

        if (followersCount) {
            followersCount.textContent = perfil.followers ?? "—";
        }
    } catch (error) {
        console.warn("Os dados complementares do perfil não foram carregados.", error);
    }
}

function createFallbackRepository(configuracao) {
    return {
        name: configuracao.repositorio,
        full_name: `${configuracao.usuario}/${configuracao.repositorio}`,
        description: "Projeto em destaque disponível no GitHub.",
        html_url: `https://github.com/${configuracao.usuario}/${configuracao.repositorio}`,
        homepage: "",
        language: "GitHub",
        topics: [],
    };
}

async function getFeaturedRepository(configuracao) {
    try {
        const repositorio = await fetchGitHub(
            `https://api.github.com/repos/${configuracao.usuario}/${configuracao.repositorio}`,
        );

        return { ...repositorio, configuracao };
    } catch (error) {
        console.warn(
            `O destaque ${configuracao.usuario}/${configuracao.repositorio} usará dados locais.`,
            error,
        );

        return {
            ...createFallbackRepository(configuracao),
            configuracao,
        };
    }
}

function createFeaturedCard(repositorio, index) {
    const article = document.createElement("article");
    const linguagem = repositorio.language || "GitHub";
    const descricao = truncar(
        repositorio.description || "Projeto desenvolvido e publicado no GitHub.",
        125,
    );
    const imagem = repositorio.configuracao.imagem?.trim();
    const deployLink = repositorio.homepage
        ? `
            <a
                href="${escapeHTML(repositorio.homepage)}"
                class="featured-card__link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir deploy de ${escapeHTML(repositorio.name)}"
            >
                Deploy ↗
            </a>
        `
        : "";

    article.className = "featured-card";

    if (imagem) {
        try {
            const imageUrl = new URL(imagem);

            if (!["http:", "https:"].includes(imageUrl.protocol)) {
                throw new Error("A capa precisa usar uma URL HTTP ou HTTPS.");
            }

            const safeImageUrl = imageUrl.href.replaceAll('"', "%22");
            article.classList.add("has-cover");
            article.style.setProperty(
                "--featured-cover",
                `url("${safeImageUrl}")`,
            );
        } catch (error) {
            console.warn(
                `A imagem de capa de ${repositorio.name} não é uma URL válida.`,
                error,
            );
        }
    }

    article.innerHTML = `
        <div class="featured-card__content">
            <div class="featured-card__heading">
                <span class="featured-card__index">
                    Projeto em destaque · ${String(index + 1).padStart(2, "0")}
                </span>
                <div class="featured-card__visual" aria-hidden="true">
                    <img
                        src="${getLanguageIcon(linguagem)}"
                        alt=""
                        width="34"
                        height="34"
                    />
                </div>
            </div>
            <h3>${escapeHTML(formatarNome(repositorio.name))}</h3>
            <p>${escapeHTML(descricao)}</p>

            <div class="featured-card__footer">
                <div class="project-tags">
                    ${getTags(repositorio)}
                </div>
                <div class="featured-card__links">
                    <a
                        href="${escapeHTML(repositorio.html_url)}"
                        class="featured-card__link"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Abrir ${escapeHTML(repositorio.name)} no GitHub"
                    >
                        GitHub ↗
                    </a>
                    ${deployLink}
                </div>
            </div>
        </div>
    `;

    return article;
}

async function getFeaturedProjects() {
    if (!featuredContainer) return;

    const repositorios = await Promise.all(
        PROJETOS_PRINCIPAIS.map(getFeaturedRepository),
    );

    featuredContainer.replaceChildren(
        ...repositorios.map(createFeaturedCard),
    );
}

function renderRecentProject(repositorio) {
    const linguagem = repositorio.language || "GitHub";
    const descricao = truncar(
        repositorio.description || "Projeto desenvolvido e publicado no GitHub.",
        110,
    );
    const botaoDeploy = repositorio.homepage
        ? `
            <a
                href="${escapeHTML(repositorio.homepage)}"
                target="_blank"
                rel="noopener noreferrer"
                class="botao-outline botao-sm"
            >
                Deploy ↗
            </a>
        `
        : "";

    return `
        <div class="swiper-slide">
            <article class="project-card">
                <figure class="project-image">
                    <img
                        src="${getLanguageIcon(linguagem)}"
                        alt="Ícone de ${escapeHTML(linguagem)}"
                        width="76"
                        height="76"
                        loading="lazy"
                    />
                </figure>

                <div class="project-content">
                    <div class="project-kicker">
                        <span>${escapeHTML(linguagem)}</span>
                        <time datetime="${escapeHTML(repositorio.updated_at || "")}">
                            ${escapeHTML(formatarData(repositorio.updated_at))}
                        </time>
                    </div>

                    <h3>${escapeHTML(formatarNome(repositorio.name))}</h3>
                    <p>${escapeHTML(descricao)}</p>

                    <div class="project-tags">
                        ${getTags(repositorio)}
                    </div>

                    <div class="project-buttons">
                        <a
                            href="${escapeHTML(repositorio.html_url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="botao botao-sm"
                        >
                            GitHub ↗
                        </a>
                        ${botaoDeploy}
                    </div>
                </div>
            </article>
        </div>
    `;
}

function initializeSwiper() {
    const swiperElement = document.querySelector(".projects-swiper");
    if (!swiperElement) return;

    if (typeof window.Swiper !== "function") {
        swiperElement.classList.add("is-static");
        return;
    }

    projectsSwiper?.destroy(true, true);
    projectsSwiper = new window.Swiper(".projects-swiper", {
        slidesPerView: 1,
        spaceBetween: 16,
        speed: reduceMotion.matches ? 0 : 550,
        watchOverflow: true,
        grabCursor: true,
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 18,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 20,
            },
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        keyboard: {
            enabled: true,
        },
        a11y: {
            enabled: true,
            prevSlideMessage: "Projeto anterior",
            nextSlideMessage: "Próximo projeto",
            paginationBulletMessage: "Ir para o projeto {{index}}",
        },
    });
}

async function getRecentProjects() {
    if (!swiperWrapper) return;

    try {
        const repositorios = await fetchGitHub(
            `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&direction=desc&per_page=30`,
        );
        const nomesPrincipais = new Set(
            PROJETOS_PRINCIPAIS.map(
                (projeto) =>
                    `${projeto.usuario}/${projeto.repositorio}`.toLowerCase(),
            ),
        );
        const recentes = repositorios
            .filter(
                (repositorio) =>
                    !nomesPrincipais.has(repositorio.full_name.toLowerCase()),
            )
            .slice(0, MAX_PROJETOS_RECENTES);

        if (!recentes.length) {
            throw new Error("Nenhum repositório recente foi encontrado.");
        }

        swiperWrapper.innerHTML = recentes.map(renderRecentProject).join("");
        initializeSwiper();
    } catch (error) {
        console.warn("Os projetos recentes não foram carregados.", error);
        swiperWrapper.innerHTML = `
            <div class="swiper-slide">
                <div class="empty-state">
                    Os projetos recentes estão descansando por um instante.
                    Você pode encontrá-los diretamente no
                    <a
                        href="https://github.com/${GITHUB_USER}?tab=repositories"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-link"
                    >
                        GitHub ↗
                    </a>
                </div>
            </div>
        `;
        initializeSwiper();
    }
}

function setFieldError(field, errorElement, message) {
    field.setAttribute("aria-invalid", message ? "true" : "false");
    errorElement.textContent = message;
}

function initializeForm() {
    if (!formulario) return;

    const fields = {
        nome: {
            input: formulario.querySelector("#nome"),
            error: formulario.querySelector("#erro-nome"),
        },
        email: {
            input: formulario.querySelector("#email"),
            error: formulario.querySelector("#erro-email"),
        },
        assunto: {
            input: formulario.querySelector("#assunto"),
            error: formulario.querySelector("#erro-assunto"),
        },
        mensagem: {
            input: formulario.querySelector("#mensagem"),
            error: formulario.querySelector("#erro-mensagem"),
        },
    };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    Object.values(fields).forEach(({ input, error }) => {
        input.addEventListener("input", () => setFieldError(input, error, ""));
    });

    formulario.addEventListener("submit", (event) => {
        event.preventDefault();

        let firstInvalidField = null;

        Object.values(fields).forEach(({ input, error }) => {
            setFieldError(input, error, "");
        });

        if (fields.nome.input.value.trim().length < 3) {
            setFieldError(
                fields.nome.input,
                fields.nome.error,
                "Digite um nome com pelo menos 3 caracteres.",
            );
            firstInvalidField ||= fields.nome.input;
        }

        if (!emailRegex.test(fields.email.input.value.trim())) {
            setFieldError(
                fields.email.input,
                fields.email.error,
                "Digite um endereço de e-mail válido.",
            );
            firstInvalidField ||= fields.email.input;
        }

        if (fields.assunto.input.value.trim().length < 5) {
            setFieldError(
                fields.assunto.input,
                fields.assunto.error,
                "Conte o assunto em pelo menos 5 caracteres.",
            );
            firstInvalidField ||= fields.assunto.input;
        }

        if (fields.mensagem.input.value.trim().length < 10) {
            setFieldError(
                fields.mensagem.input,
                fields.mensagem.error,
                "Escreva uma mensagem com pelo menos 10 caracteres.",
            );
            firstInvalidField ||= fields.mensagem.input;
        }

        if (firstInvalidField) {
            firstInvalidField.focus();
            return;
        }

        const submitButton = formulario.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Enviando…";
        formulario.submit();
    });
}

function initializePage() {
    initializeTheme();
    initializePointerTrail();
    initializeHeader();
    initializeNavigation();
    initializeForm();

    const currentYear = document.querySelector("#current-year");
    if (currentYear) currentYear.textContent = new Date().getFullYear();

    getAboutGitHub();
    getFeaturedProjects();
    getRecentProjects();
}

initializePage();
