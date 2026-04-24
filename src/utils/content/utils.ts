import { getLocalConfig } from "../config/storage"
import { DEFAULT_CONFIG } from "../constants/config"
import { isDontWalkIntoAndDontTranslateAsChildElement, isHTMLElement } from "../host/dom/filter"

export const MAX_TEXT_LENGTH = 3000

const ZERO_WIDTH_CHARS_RE = /[\u200B-\u200D\uFEFF]/g
const WHITESPACE_RUN_RE = /\s+/g

export async function removeDummyNodes(root: Document) {
  const config = await getLocalConfig() ?? DEFAULT_CONFIG

  const removeDummyDescendants = (element: Element) => {
    if (!isHTMLElement(element)) {
      return
    }

    if (isDontWalkIntoAndDontTranslateAsChildElement(element, config)) {
      element.remove()
      return
    }

    for (const child of Array.from(element.children)) {
      removeDummyDescendants(child)
    }
  }

  for (const child of Array.from(root.children)) {
    removeDummyDescendants(child)
  }
}

/**
 * Clean and truncate article text for post processing
 */
export function cleanText(textContent: string, maxLength: number = MAX_TEXT_LENGTH): string {
  const cleaned = textContent
    .replace(ZERO_WIDTH_CHARS_RE, "") // 零宽字符
    .replace(WHITESPACE_RUN_RE, " ")
    .trim()

  return cleaned.length <= maxLength ? cleaned : cleaned.slice(0, maxLength)
}
