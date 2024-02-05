export const FALSE_CURSOR_CODE = `
const newDiv = document.createElement("div");

newDiv.style.position = "absolute";
newDiv.style.pointerEvents = "none";
newDiv.style.zIndex = "100000";

var doc = new DOMParser().parseFromString(
  \`<svg width="36" height="36" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_1_12)">
        <g filter="url(#filter0_d_1_12)">
          <path d="M0 0V256L77.8667 163.2L205.333 172.267L0 0Z" fill="white"/>
          <path d="M78.3633 156.218L74.8003 155.964L72.5043 158.701L7 236.767V15.01L184.294 163.752L78.3633 156.218Z" stroke="black" stroke-width="14"/>
        </g>
      </g>
      <defs>
        <filter id="filter0_d_1_12" x="-4.6" y="0" width="242.533" height="301.6" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="14" dy="27"/>
          <feGaussianBlur stdDeviation="9.3"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_12"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_12" result="shape"/>
        </filter>
        <clipPath id="clip0_1_12">
          <rect width="300" height="300" fill="white"/>
        </clipPath>
      </defs>
    </svg>\`,
  "application/xml"
);

newDiv.appendChild(document.importNode(doc.documentElement, true));
document.body.appendChild(newDiv);

document.addEventListener("mousemove", (e) => {
  newDiv.style.left = e.pageX + "px";
  newDiv.style.top = e.pageY + "px";
});
`