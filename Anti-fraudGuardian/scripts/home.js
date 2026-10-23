const imageNames = ["homepage1", "homepage2", "homepage3", "homepage4"];

const imageExtensions = ["jpg", "jpeg", "png", "webp"];
const track = document.querySelector(".carousel-track");
const dots = document.querySelector(".carousel-dots");
const previousButton = document.querySelector(".carousel-prev");
const nextButton = document.querySelector(".carousel-next");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".main-nav");

let currentIndex = 0;
let timerId = null;
let imageSources = [];

function findImageSource(name) {
  return new Promise((resolve) => {
    let extensionIndex = 0;

    function tryNextExtension() {
      if (extensionIndex >= imageExtensions.length) {
        resolve("");
        return;
      }

      const extension = imageExtensions[extensionIndex];
      const source = `images/${name}.${extension}`;
      const image = new Image();

      image.onload = () => resolve(source);
      image.onerror = () => {
        extensionIndex += 1;
        tryNextExtension();
      };

      image.src = source;
    }

    tryNextExtension();
  });
}

async function loadImageSources() {
  const sources = await Promise.all(
    imageNames.map((name) => findImageSource(name)),
  );

  imageSources = sources.filter(Boolean);

  if (imageSources.length === 0) {
    track.innerHTML = `
      <div class="carousel-slide is-active" style="
        background:
          linear-gradient(135deg, #ebe3d7, #d8c5ad);
      "></div>
    `;
    return;
  }

  renderSlides();
  renderDots();
  showSlide(0);
  startAutoplay();
}

function renderSlides() {
  track.innerHTML = imageSources
    .map(
      (source) => `
        <div
          class="carousel-slide"
          style="background-image: url('${source}')"
          role="img"
          aria-label="银龄守护项目图片"
        ></div>
      `,
    )
    .join("");
}

function renderDots() {
  dots.innerHTML = imageSources
    .map(
      (_, index) => `
        <button
          class="carousel-dot"
          type="button"
          aria-label="查看第 ${index + 1} 张图片"
          data-index="${index}"
        ></button>
      `,
    )
    .join("");

  dots.querySelectorAll(".carousel-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.index));
      restartAutoplay();
    });
  });
}

function showSlide(index) {
  const slides = track.querySelectorAll(".carousel-slide");
  const slideDots = dots.querySelectorAll(".carousel-dot");

  if (!slides.length) {
    return;
  }

  currentIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === currentIndex);
  });

  slideDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === currentIndex);
  });
}

function startAutoplay() {
  timerId = window.setInterval(() => {
    showSlide(currentIndex + 1);
  }, 6000);
}

function restartAutoplay() {
  window.clearInterval(timerId);
  startAutoplay();
}

previousButton.addEventListener("click", () => {
  showSlide(currentIndex - 1);
  restartAutoplay();
});

nextButton.addEventListener("click", () => {
  showSlide(currentIndex + 1);
  restartAutoplay();
});

menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

loadImageSources();
