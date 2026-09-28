/**
 * Copies text to the clipboard, falling back where the async API is unavailable.
 *
 * `navigator.clipboard` is only defined in a secure context — HTTPS, or
 * localhost. A self-hosted instance reached over plain HTTP has no such API, so
 * the deprecated `document.execCommand("copy")` path is the only one that works
 * there and is kept deliberately rather than as dead weight.
 *
 * Returns whether the text reached the clipboard by either route, so a caller
 * shows the "copied" notice only when the copy actually happened. A user who is
 * told the link is on their clipboard when it is not has no way to tell.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Denied permission, or a document that is not focused. Fall through
      // instead of reporting failure: the legacy path may still work.
    }
  }

  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  // Kept off-screen rather than hidden. `execCommand` ignores elements that are
  // not rendered, so `display: none` or `visibility: hidden` would break the
  // copy this fallback exists to perform.
  scratch.style.position = "fixed";
  scratch.style.top = "-9999px";
  scratch.style.opacity = "0";
  document.body.append(scratch);

  try {
    scratch.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    scratch.remove();
  }
}
