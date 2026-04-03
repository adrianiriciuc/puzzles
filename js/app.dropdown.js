function AppDropdown(element) {
    const emitter = new EventEmitter();

    const toggle = element.querySelector(".dropdown-toggle");
    const menu = element.querySelector(".dropdown-menu");

    let currentValue = toggle.textContent.trim();

    menu.querySelectorAll(".dropdown-item").forEach((item) => {
       item.addEventListener("click", () => {
           const value = item.textContent.trim();
           if (value !== currentValue) {
               currentValue = value;
               toggle.innerHTML = value;
               emitter.emit("change", currentValue);
           }
       });
    });

    this.on = (event, cb) => emitter.on(event, cb);

    this.getValue = () => {
        return currentValue;
    }
}