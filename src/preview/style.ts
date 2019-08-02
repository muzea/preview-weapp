function handleRule(rule: CSSRule): string {
  if (rule.type === 4) {
    // MediaRule
    const { cssRules, media } = rule as CSSMediaRule;
    return `@media ${media.mediaText} { ${handleRuleList(cssRules)} }`;
  }
  if (rule.type === 1) {
    // StyleRule
    const { selectorText, cssText } = rule as CSSStyleRule;
    return cssText.replace(selectorText, _selectorText =>
      _selectorText.replace(
        /(?<=[^-a-zA-Z]|^)([-a-zA-Z]+?)(?=[^-a-zA-Z]|$)/g,
        name => `wx-${name}`
      )
    );
  }
  return rule.cssText;
}

function handleRuleList(list: CSSRuleList): string {
  const result: string[] = [];
  const end = list.length;
  for (let index = 0; index < end; ++index) {
    result.push(handleRule(list[index]));
  }
  return result.join("\n");
}

function replaceName(content: string, host: HTMLElement): string {
  const container = document.createElement("style");
  const id = Math.random().toString();
  container.setAttribute('class', id);
  container.textContent = content;
  host.append(container)
  const cssRules = (container.sheet as any).cssRules as CSSRuleList;
  host.getElementsByClassName(id)[0].remove();
  return handleRuleList(cssRules);
}

export { replaceName };
