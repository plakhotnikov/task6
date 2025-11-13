const input = document.getElementById('inputLine');
const parseBtn = document.getElementById('parseBtn');
const block3 = document.getElementById('block3');
const block2 = document.getElementById('block2');
const output = document.getElementById('output');
const clickInfo = document.getElementById('click-info');

let items = {}; // id -> объект
let dragItemId = null;

parseBtn.addEventListener('click', () => {
    const line = input.value.trim();
    if (!line) {
        alert('Введите строку со словами, разделёнными тире "-"');
        return;
    }
    createItemsFromLine(line);
});

function createItemsFromLine(line) {
    items = {};
    block3.innerHTML = '';
    block2.innerHTML = '';
    output.innerHTML = '';
    clickInfo.textContent = 'Нажмите на элемент в синем блоке, чтобы слово появилось здесь.';

    const rawParts = line.split('-').map(p => p.trim()).filter(p => p.length > 0);

    const lower = [];
    const upper = [];
    const numbers = [];

    rawParts.forEach(word => {
        if (/^\d+$/.test(word)) {
            numbers.push(word);
        } else {
            const first = word.charAt(0);
            if (/[a-zа-яё]/.test(first)) {
                lower.push(word);
            } else if (/[A-ZА-ЯЁ]/.test(first)) {
                upper.push(word);
            } else {
                // не буква/цифра – считаем как строчную
                lower.push(word);
            }
        }
    });

    lower.sort((a, b) => a.localeCompare(b));
    upper.sort((a, b) => a.localeCompare(b));
    numbers.sort((a, b) => Number(a) - Number(b));

    let all = [];

    lower.forEach((w, index) => {
        all.push({ key: 'a' + (index + 1), value: w, type: 'wordLower' });
    });
    upper.forEach((w, index) => {
        all.push({ key: 'b' + (index + 1), value: w, type: 'wordUpper' });
    });
    numbers.forEach((w, index) => {
        all.push({ key: 'n' + (index + 1), value: w, type: 'number' });
    });

    all.forEach((obj, idx) => {
        const id = 'item-' + idx;
        obj.id = id;
        obj.originalIndex = idx;
        obj.originalColor = '#d3d3d3';
        obj.randomColor = null;
        obj.clicks = 0;
        items[id] = obj;
        block3.appendChild(createPillElement(obj));
    });
}

function createPillElement(obj) {
    const div = document.createElement('div');
    div.className = 'pill';
    div.draggable = true;
    div.id = obj.id;
    div.textContent = obj.key + ' ' + obj.value;
    div.style.backgroundColor = obj.originalColor;
    div.dataset.key = obj.key;
    div.dataset.value = obj.value;
    div.dataset.originalIndex = obj.originalIndex;

    div.addEventListener('dragstart', (e) => {
        dragItemId = obj.id;
        div.classList.add('dragging');
        e.dataTransfer.setData('text/plain', obj.id);
    });

    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        dragItemId = null;
    });

    // клик – только если сейчас в блоке 2
    div.addEventListener('click', () => {
        if (div.parentElement && div.parentElement.id === 'block2') {
            handleClickOnPill(obj.id);
        }
    });

    return div;
}

function handleClickOnPill(id) {
    const obj = items[id];
    if (!obj) return;

    obj.clicks += 1;

    const span = document.createElement('span');
    span.textContent = (output.textContent ? ' ' : '') + obj.value;
    span.style.color = obj.randomColor || obj.originalColor;
    output.appendChild(span);

    // обновляем текст с количеством кликов
    const parts = Object.values(items)
        .filter(o => o.clicks > 0)
        .map(o => {
            const times = o.clicks;
            const wordForm = (times === 1) ? 'раз' :
                (times >= 2 && times <= 4) ? 'раза' : 'раз';
            return `нажали ${times} ${wordForm} на элемент "${o.key} ${o.value}"`;
        });

    clickInfo.textContent = parts.length
        ? parts.join(', ')
        : 'Нажмите на элемент в синем блоке, чтобы слово появилось здесь.';
}

function randColor() {
    // мягкие случайные цвета
    const r = 100 + Math.floor(Math.random() * 155);
    const g = 100 + Math.floor(Math.random() * 155);
    const b = 100 + Math.floor(Math.random() * 155);
    return `rgb(${r},${g},${b})`;
}

// Работа с dnd для блоков 2 и 3
[block2, block3].forEach(container => {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('over');
    });

    container.addEventListener('dragleave', () => {
        container.classList.remove('over');
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('over');

        const id = e.dataTransfer.getData('text/plain') || dragItemId;
        if (!id) return;
        const elem = document.getElementById(id);
        if (!elem) return;

        if (container.id === 'block2') {
            if (!items[id].randomColor) {
                items[id].randomColor = randColor();
            }
            elem.style.backgroundColor = items[id].randomColor;
        }

        if (container.id === 'block3') {
            elem.style.backgroundColor = items[id].originalColor;
            elem.classList.remove('pill-floating');
            elem.style.left = '';
            elem.style.top = '';
        }

        container.appendChild(elem);

        if (container.id === 'block2') {
            elem.classList.add('pill-floating');
            placeElementWithinBlock2(elem, e);
        }

        if (container.id === 'block3') {
            reorderBlock3();
        }
    });
});

function reorderBlock3() {
    const children = Array.from(block3.children);
    children.sort((a, b) => {
        return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
    });
    children.forEach(ch => block3.appendChild(ch));
}

function placeElementWithinBlock2(elem, event) {
    const rect = block2.getBoundingClientRect();
    const elemWidth = elem.offsetWidth || 140;
    const elemHeight = elem.offsetHeight || 42;

    let left = event.clientX - rect.left - elemWidth / 2;
    let top = event.clientY - rect.top - elemHeight / 2;

    left = Math.max(0, Math.min(left, rect.width - elemWidth));
    top = Math.max(0, Math.min(top, rect.height - elemHeight));

    elem.style.left = `${left}px`;
    elem.style.top = `${top}px`;
}
