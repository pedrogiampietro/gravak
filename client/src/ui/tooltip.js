const Tooltip = function () {
    this.element = document.createElement("div");
    this.element.className = "tooltip-container";
    this.element.style.display = "none";
    document.body.appendChild(this.element);

    // Cache for item colors to avoid recalculating every mouseover
    this.colorCache = new Map();
    // Off-screen canvas for color analysis
    this.canvas = document.createElement("canvas");
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext("2d");
};

Tooltip.prototype.show = function (item, targetElement) {
    if (!item) return;

    const dataObject = item.getDataObject();
    if (!dataObject) return;

    // Generate content first to fail fast if needed
    const content = this.__generateContent(item, dataObject);
    this.element.innerHTML = content;

    // Style the background based on item dominant color
    this.__applyTheme(item);

    // Show and position
    this.element.style.display = "block";
    this.__position(targetElement);
};

Tooltip.prototype.hide = function () {
    this.element.style.display = "none";
};

Tooltip.prototype.__position = function (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = this.element.getBoundingClientRect();

    // Default to right side of the slot
    let left = rect.right + 10;
    let top = rect.top;

    // Check right edge
    if (left + tooltipRect.width > window.innerWidth) {
        left = rect.left - tooltipRect.width - 10;
    }

    // Check bottom edge
    if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height - 10;
    }

    // Check top edge
    if (top < 0) {
        top = 10;
    }

    this.element.style.left = left + "px";
    this.element.style.top = top + "px";
};

Tooltip.prototype.__applyTheme = function (item) {
    const color = this.__getDominantColor(item);

    // Apply gradient background to the header part mostly
    // We will assume the structure has a header
    const header = this.element.querySelector(".tooltip-header");
    if (header) {
        header.style.background = `linear-gradient(135deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.8), rgba(${color.r * 0.5}, ${color.g * 0.5}, ${color.b * 0.5}, 0.9))`;
        // Add a colored border top to the body
        this.element.style.borderColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
    }
};

Tooltip.prototype.__getDominantColor = function (item) {
    const cacheKey = item.id; // Simple ID based cache for generic items. For caching unique items might need more.

    if (this.colorCache.has(cacheKey)) {
        return this.colorCache.get(cacheKey);
    }

    // Draw sprite to canvas
    this.ctx.clearRect(0, 0, 32, 32);

    // We need to draw the item sprite. 
    // We can shortcut by assuming the item has a simple sprite for now.
    // Ideally we use a helper from Canvas/Renderer but we can try to get the frame directly.
    const frameGroup = item.getFrameGroup(FrameGroup.prototype.NONE);
    const frame = item.getFrame();
    const pattern = item.getPattern();

    // Just get the first sprite layer
    const sprite = frameGroup.getSprite(frameGroup.getSpriteIndex(frame, pattern.x, pattern.y, pattern.z, 0, 0, 0));

    if (sprite && sprite.src) {
        this.ctx.drawImage(sprite.src,
            32 * sprite.position.x, 32 * sprite.position.y, 32, 32,
            0, 0, 32, 32
        );

        const imageData = this.ctx.getImageData(0, 0, 32, 32);
        const data = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 10) { // Not transparent
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
        }

        if (count > 0) {
            const color = {
                r: Math.round(r / count),
                g: Math.round(g / count),
                b: Math.round(b / count)
            };
            this.colorCache.set(cacheKey, color);
            return color;
        }
    }

    return { r: 100, g: 100, b: 100 }; // Default gray
};

Tooltip.prototype.__generateContent = function (item, dataObject) {

    // Merge properties from Tibia.dat (dataObject) and definitions.json (server data)
    let props = dataObject.properties || {};
    let serverProps = {};

    if (gameClient.itemDefinitions && gameClient.itemDefinitions[item.id]) {
        serverProps = gameClient.itemDefinitions[item.id].properties || {};
    }

    // Prefer server properties for name/stats as they are more complete
    const name = serverProps.name || props.name || "Unknown Item";
    const weight = serverProps.weight || props.weight;
    const attack = serverProps.attack || props.attack;
    const defense = serverProps.defense || props.defense;
    const armor = serverProps.armor || props.armor;
    const description = serverProps.description || props.description;

    // Helper to get image HTML
    const spriteHtml = this.__getItemSpriteHtml(item);

    let statsHtml = '<div class="tooltip-stats">';

    if (armor) statsHtml += `<div class="stat"><span class="icon">🛡️</span> Armor: ${armor}</div>`;
    if (attack) statsHtml += `<div class="stat"><span class="icon">⚔️</span> Attack: ${attack}</div>`;
    if (defense) statsHtml += `<div class="stat"><span class="icon">🛡️</span> Defense: ${defense}</div>`;
    if (weight) statsHtml += `<div class="stat"><span class="icon">⚖️</span> Weight: ${(weight / 100).toFixed(2)} oz</div>`;

    statsHtml += '</div>';

    let descriptionHtml = '';
    if (description) {
        descriptionHtml = `<div class="tooltip-description">📖 ${description}</div>`;
    } else if (dataObject.flags.get(PropBitFlag.prototype.flags.DatFlagMultiUse)) {
        // Generic hint for usable items
        descriptionHtml = `<div class="tooltip-description">Use with...</div>`;
    }

    // Handle pluralization for stackables
    let title = name;
    if (item.isStackable() && item.count > 1) {
        // Simple pluralizer: add 's' if not present
        if (!title.endsWith('s')) title += 's';
    }
    // Capitalize Title
    title = title.replace(/\b\w/g, l => l.toUpperCase());

    return `
    <div class="tooltip-header">
      <div class="tooltip-image-container">${spriteHtml}</div>
      <div class="tooltip-weight-header">${weight ? (weight / 100).toFixed(2) + ' oz' : ''}</div>
    </div>
    <div class="tooltip-body">
      <div class="tooltip-title">${title}</div>
      ${statsHtml}
      ${descriptionHtml}
    </div>
  `;
};

Tooltip.prototype.__getItemSpriteHtml = function (item) {
    // Generate an inline canvas or image tag. 
    // Since we already have a canvas for color calc, we could reuse or just create a new one.
    // Simpler is to use a specific container that we draw into later, but for now CSS classes might be easier 
    // if we can just reference the sprite sheet. But sprite sheet coords are complex.
    // Let's assume we can clone the slot logic or just return an empty div that we populate or style.

    // Actually, drawing the sprite to base64 might be easiest for this quick implementation 
    // without messing with complex DOM structures that depend on game loop.

    // We can reuse the result from __getDominantColor's draw call if we structured it differently,
    // but re-drawing 32x32 once on hover is cheap.

    // Redraw for display (clear first)
    this.ctx.clearRect(0, 0, 32, 32);
    const frameGroup = item.getFrameGroup(FrameGroup.prototype.NONE);
    const frame = item.getFrame();
    const pattern = item.getPattern();
    const sprite = frameGroup.getSprite(frameGroup.getSpriteIndex(frame, pattern.x, pattern.y, pattern.z, 0, 0, 0));

    if (sprite && sprite.src) {
        this.ctx.drawImage(sprite.src,
            32 * sprite.position.x, 32 * sprite.position.y, 32, 32,
            0, 0, 32, 32
        );

        // Add item count if stackable
        if (item.isStackable() && item.count > 1) {
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 10px Verdana";
            this.ctx.strokeStyle = "black";
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(item.count, 2, 30);
            this.ctx.fillText(item.count, 2, 30);
        }

        return `<img src="${this.canvas.toDataURL()}" width="32" height="32" style="image-rendering: pixelated;">`;
    }

    return '';
};
