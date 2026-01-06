const measureTextWidth = (text, fontSize, padding = 30, fontFamily) => {
    // 创建一个canvas元素
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error("无法创建画布上下文");
    }
    // 设置字体样式，这里结合字号和字体家族
    let defaultFontFamily = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`;
    context.font = `${fontSize || 14}px ${fontFamily || defaultFontFamily}`;
    // 测量文本
    const metrics = context.measureText(text);
    const width = metrics.width;
    // 清理：从 DOM 中移除canvas
    canvas.remove();
    return width + padding;
};
export { measureTextWidth };
