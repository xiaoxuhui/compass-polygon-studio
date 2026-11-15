const number = value => {
  const fixed = value.toFixed(12).replace(/\.?0+$/, '');
  return fixed === '-0' ? '0' : fixed;
};
const pair = p => `\\left(${number(p.x)},${number(p.y)}\\right)`;
const shift = (variable, origin) => {
  const offset = number(Math.abs(origin));
  return offset === '0' ? variable : `\\left(${variable}${origin < 0 ? '+' : '-'}${offset}\\right)`;
};

function shapeExpression(shape) {
  if (shape.type === 'circle') {
    const {x, y} = shape.c;
    return `${shift('x', x)}^{2}+${shift('y', y)}^{2}=${number(shape.r)}^{2}`;
  }
  const {a, b} = shape;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const vertical = Math.abs(dy) > Math.abs(dx);
  const input = vertical ? 'y' : 'x';
  const output = vertical ? 'x' : 'y';
  const slope = number(vertical ? dx / dy : dy / dx);
  const intercept = number(a[output]);
  let latex = `${output}=${intercept}`;
  if (slope !== '0') latex += `${slope.startsWith('-') ? '' : '+'}${slope}${shift(input, a[input])}`;
  if (shape.type === 'segment') {
    const lo = number(Math.min(a[input], b[input]));
    const hi = number(Math.max(a[input], b[input]));
    latex += `\\left\\{${lo}\\le ${input}\\le ${hi}\\right\\}`;
  }
  return latex;
}

export function desmosExpressions({shapes, points}, showLabels) {
  return [
    ...shapes.map(shape => ({
      type: 'expression',
      id: `compass-shape-${shape.id}`,
      latex: shapeExpression(shape),
      color: shape.role === 'aux' ? '#879a75' : '#315f4c'
    })),
    ...points.map(point => ({
      type: 'expression',
      id: `compass-point-${point.id}`,
      latex: pair(point),
      color: point.base || point.vertex ? '#315f4c' : '#879a75',
      label: point.label,
      showLabel: showLabels
    }))
  ];
}

export function desmosClipboard(expressions, title) {
  const plain = expressions.map(entry => entry.latex).join('\n');
  // Desmos imports the full list when it starts with a folder and its members.
  const folderId = 'compass-export';
  const folder = {type: 'folder', id: folderId, title, collapsed: false};
  const items = [folder, ...expressions.map(entry => ({...entry, folderId}))];
  const html = document.createElement('div');
  html.setAttribute('data-dcg-clipboard-format', 'dcg-copy-expression');
  html.setAttribute('data-dcg-clipboard-payload', JSON.stringify(items));
  html.textContent = plain;
  return {'text/plain': plain, 'text/html': html.outerHTML};
}

export async function copyDesmos(data) {
  try {
    const parts = Object.fromEntries(Object.entries(data).map(([type, value]) => [type, new Blob([value], {type})]));
    await navigator.clipboard.write([new ClipboardItem(parts)]);
    return true;
  } catch {
    let wrote = false;
    const onCopy = event => {
      if (!event.clipboardData) return;
      event.preventDefault();
      for (const [type, value] of Object.entries(data)) event.clipboardData.setData(type, value);
      wrote = true;
    };
    document.addEventListener('copy', onCopy, {once: true});
    try {
      return document.execCommand('copy') && wrote;
    } catch {
      return false;
    } finally {
      document.removeEventListener('copy', onCopy);
    }
  }
}
