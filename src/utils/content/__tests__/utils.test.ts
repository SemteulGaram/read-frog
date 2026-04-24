// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { removeDummyNodes } from "../utils"

vi.mock("@/utils/config/storage", () => ({
  getLocalConfig: vi.fn(async () => null),
}))

describe("removeDummyNodes", () => {
  it("still removes nodes hidden by computed style", async () => {
    const testDocument = document.implementation.createHTMLDocument("test")
    const hidden = testDocument.createElement("div")
    hidden.className = "stylesheet-hidden"
    hidden.textContent = "hidden text"
    testDocument.body.appendChild(hidden)

    const originalGetComputedStyle = window.getComputedStyle.bind(window)
    const getComputedStyleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const style = originalGetComputedStyle(element)
      if (element === hidden) {
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === "display")
              return "none"
            return Reflect.get(target, prop, receiver)
          },
        }) as CSSStyleDeclaration
      }
      return style
    })

    try {
      await removeDummyNodes(testDocument)
      expect(testDocument.body.textContent).not.toContain("hidden text")
    }
    finally {
      getComputedStyleSpy.mockRestore()
    }
  })

  it("does not inspect descendants after removing a hidden subtree", async () => {
    const testDocument = document.implementation.createHTMLDocument("test")
    const hiddenParent = testDocument.createElement("section")
    hiddenParent.hidden = true
    const child = testDocument.createElement("div")
    child.textContent = "nested text"
    hiddenParent.appendChild(child)
    testDocument.body.appendChild(hiddenParent)

    const checkedElements: Element[] = []
    const originalGetComputedStyle = window.getComputedStyle.bind(window)
    const getComputedStyleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      checkedElements.push(element)
      return originalGetComputedStyle(element)
    })

    try {
      await removeDummyNodes(testDocument)
      expect(testDocument.body.textContent).not.toContain("nested text")
      expect(checkedElements).not.toContain(child)
    }
    finally {
      getComputedStyleSpy.mockRestore()
    }
  })
})
