import { Img } from "@react-email/components";

import { APP_NAME, CLIENT_URL } from "./email-env";

/**
 * The brand mark that opens every template.
 *
 * The source is the web app's favicon set, served from the public origin: email
 * clients cannot load bundled assets, so the logo has to be an absolute URL.
 * `alt` carries the product name, which is what a client that blocks images by
 * default shows in its place.
 */
export function EmailLogo() {
  return (
    <Img
      src={`${CLIENT_URL}/favicon-196x196.png`}
      alt={APP_NAME}
      width={28}
      height={28}
      className="m-0 block rounded-sm"
    />
  );
}
