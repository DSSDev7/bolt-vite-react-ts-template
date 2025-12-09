/**
 * Element Inspector Script
 * Enables visual element selection in the preview iframe
 * Communicates with parent window via postMessage
 */

// State
let isInspectorActive = false
let currentHighlight: HTMLElement | null = null
let selectedElement: HTMLElement | null = null
let inspectorStyle: HTMLStyleElement | null = null

// CSS for inspector highlights
const INSPECTOR_CSS = `
  .inspector-active * {
    cursor: crosshair !important;
  }

  .inspector-highlight {
    outline: 2px solid #3b82f6 !important;
    outline-offset: -2px;
    background-color: rgba(59, 130, 246, 0.1) !important;
  }

  .inspector-selected {
    outline: 2px solid #8b5cf6 !important;
    outline-offset: -2px;
    background-color: rgba(139, 92, 246, 0.15) !important;
  }
`

/**
 * Get XPath for an element
 */
function getElementXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling: Element | null = current.previousElementSibling

    while (sibling) {
      if (sibling.nodeName === current.nodeName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    const tagName = current.nodeName.toLowerCase()
    const part = index > 1 ? `${tagName}[${index}]` : tagName
    parts.unshift(part)

    current = current.parentElement
  }

  return '/' + parts.join('/')
}

/**
 * Get element path as breadcrumb
 */
function getElementPath(element: Element): string {
  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase()
    if (current.id) {
      selector += `#${current.id}`
    } else if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).slice(0, 2)
      if (classes.length > 0 && classes[0]) {
        selector += `.${classes.join('.')}`
      }
    }
    parts.unshift(selector)
    current = current.parentElement
  }

  return parts.join(' > ')
}

/**
 * Create readable selector for element
 */
function createReadableSelector(element: Element): string {
  let selector = element.tagName.toLowerCase()

  if (element.id) {
    selector += `#${element.id}`
  }

  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(c => c && !c.startsWith('inspector-'))
    if (classes.length > 0) {
      selector += `.${classes.slice(0, 3).join('.')}`
    }
  }

  return selector
}

/**
 * Get HTML preview of element
 */
function createElementDisplayText(element: Element): string {
  const clone = element.cloneNode(false) as Element
  let html = clone.outerHTML

  // Truncate if too long
  if (html.length > 200) {
    html = html.substring(0, 200) + '...'
  }

  return html
}

/**
 * Get relevant styles for element
 */
function getRelevantStyles(element: Element): Record<string, string> {
  const computed = window.getComputedStyle(element)
  const styles: Record<string, string> = {}

  const relevantProps = [
    'color', 'backgroundColor', 'fontSize', 'fontFamily', 'fontWeight',
    'padding', 'margin', 'border', 'borderRadius', 'display', 'position'
  ]

  for (const prop of relevantProps) {
    const value = computed.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase())
    if (value && value !== 'none' && value !== 'normal' && value !== '0px') {
      styles[prop] = value
    }
  }

  return styles
}

/**
 * Check if element has editable text content
 */
function hasEditableText(element: Element): boolean {
  // Must have source location attributes
  const hasSource = element.hasAttribute('data-source-file') ||
                    element.hasAttribute('data-astro-source-file')
  if (!hasSource) return false

  // Must have text content
  const text = element.textContent?.trim() || ''
  if (!text) return false

  // Must not have complex children
  const hasComplexChildren = Array.from(element.children).some(child => {
    const tag = child.tagName.toLowerCase()
    return !['span', 'strong', 'em', 'b', 'i', 'u', 'a', 'br'].includes(tag)
  })
  if (hasComplexChildren) return false

  return true
}

/**
 * Create ElementInfo object from DOM element
 */
function createElementInfo(element: Element) {
  const rect = element.getBoundingClientRect()

  return {
    tagName: element.tagName,
    className: typeof element.className === 'string'
      ? element.className.split(/\s+/).filter(c => !c.startsWith('inspector-')).join(' ')
      : '',
    id: element.id || '',
    textContent: (element.textContent || '').trim().slice(0, 100),
    displayText: createElementDisplayText(element),
    styles: getRelevantStyles(element),
    rect: {
      x: rect.x,
      y: rect.y,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    xpath: getElementXPath(element),
    elementPath: getElementPath(element),
    selector: createReadableSelector(element),
    sourceFile: element.getAttribute('data-source-file') ||
                element.getAttribute('data-astro-source-file') || '',
    sourceLoc: element.getAttribute('data-source-loc') ||
               element.getAttribute('data-astro-source-loc') || '',
    isTextEditable: hasEditableText(element),
    currentPageUrl: window.location.pathname,
  }
}

/**
 * Handle mouse move - highlight element under cursor
 */
function handleMouseMove(e: MouseEvent) {
  if (!isInspectorActive) return

  const target = e.target as HTMLElement
  if (!target || target === document.body || target === document.documentElement) return

  // Skip if it's the same element
  if (currentHighlight === target) return

  // Remove previous highlight (but not selected)
  if (currentHighlight && currentHighlight !== selectedElement) {
    currentHighlight.classList.remove('inspector-highlight')
  }

  // Add highlight to current element (but not if it's selected)
  if (target !== selectedElement) {
    target.classList.add('inspector-highlight')
  }
  currentHighlight = target

  // Send hover info to parent
  const elementInfo = createElementInfo(target)
  window.parent.postMessage({
    type: 'INSPECTOR_HOVER',
    elementInfo,
  }, '*')
}

/**
 * Handle click - select element
 */
function handleClick(e: MouseEvent) {
  if (!isInspectorActive) return

  e.preventDefault()
  e.stopPropagation()

  const target = e.target as HTMLElement
  if (!target || target === document.body || target === document.documentElement) return

  // Remove previous selection
  if (selectedElement) {
    selectedElement.classList.remove('inspector-selected')
  }

  // Remove hover highlight
  if (currentHighlight) {
    currentHighlight.classList.remove('inspector-highlight')
  }

  // Add selection
  target.classList.add('inspector-selected')
  selectedElement = target

  // Send click info to parent
  const elementInfo = createElementInfo(target)
  window.parent.postMessage({
    type: 'INSPECTOR_CLICK',
    elementInfo,
  }, '*')
}

/**
 * Handle mouse leave - clear hover state
 */
function handleMouseLeave() {
  if (!isInspectorActive) return

  if (currentHighlight && currentHighlight !== selectedElement) {
    currentHighlight.classList.remove('inspector-highlight')
  }
  currentHighlight = null

  window.parent.postMessage({
    type: 'INSPECTOR_LEAVE',
  }, '*')
}

/**
 * Activate inspector mode
 */
function activateInspector() {
  if (isInspectorActive) return

  isInspectorActive = true

  // Inject CSS
  inspectorStyle = document.createElement('style')
  inspectorStyle.textContent = INSPECTOR_CSS
  document.head.appendChild(inspectorStyle)

  // Add active class to body
  document.body.classList.add('inspector-active')

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove, true)
  document.addEventListener('click', handleClick, true)
  document.addEventListener('mouseleave', handleMouseLeave, true)
}

/**
 * Deactivate inspector mode
 */
function deactivateInspector() {
  if (!isInspectorActive) return

  isInspectorActive = false

  // Remove event listeners
  document.removeEventListener('mousemove', handleMouseMove, true)
  document.removeEventListener('click', handleClick, true)
  document.removeEventListener('mouseleave', handleMouseLeave, true)

  // Remove active class
  document.body.classList.remove('inspector-active')

  // Remove highlights
  if (currentHighlight) {
    currentHighlight.classList.remove('inspector-highlight')
    currentHighlight = null
  }
  if (selectedElement) {
    selectedElement.classList.remove('inspector-selected')
    selectedElement = null
  }

  // Remove CSS
  if (inspectorStyle) {
    inspectorStyle.remove()
    inspectorStyle = null
  }
}

/**
 * Listen for messages from parent window
 */
function handleMessage(event: MessageEvent) {
  const { type, active } = event.data || {}

  if (type === 'INSPECTOR_ACTIVATE') {
    if (active) {
      activateInspector()
    } else {
      deactivateInspector()
    }
  }
}

/**
 * Initialize inspector
 */
function init() {
  // Listen for activation messages from parent
  window.addEventListener('message', handleMessage)

  // Notify parent that we're ready
  window.parent.postMessage({
    type: 'INSPECTOR_READY',
  }, '*')
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
