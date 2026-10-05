import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { BMC_URL, BMC_USERNAME, APP_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Sponsor() {
  usePageMeta(`Sponsor · ${APP_NAME}`, "Keep Vesper free.");
  const [imgOk, setImgOk] = useState(true);
  const src = `https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=${BMC_USERNAME}&button_colour=8c5a32&font_colour=fffdf8&font_family=Lato&outline_colour=fffdf8&coffee_colour=FFDD00`;
  return (
    <PageShell narrow>
      <h1>Keep {APP_NAME} free.</h1>
      <p>{APP_NAME} has no plans and no paywall. It runs on a small server and the maker's spare time. If it helped you, a coffee helps keep it running.</p>
      <p>
        <a href={BMC_URL} target="_blank" rel="noopener">
          {imgOk ? <img src={src} alt="Buy me a coffee" height={48} onError={() => setImgOk(false)} /> : null}
        </a>
        {!imgOk ? <Button onClick={() => window.open(BMC_URL, "_blank")}>Buy me a coffee</Button> : null}
      </p>
      <h2>Where it goes</h2>
      <ul><li>Hosting</li><li>Domain</li><li>Storage for uploaded files</li><li>Time for fixes</li></ul>
      <h2>Other ways to help</h2>
      <ul>
        <li>Report bugs via <Link to="/contact">Contact</Link></li>
        <li>Tell a friend</li>
        <li><Link to="/report">Report abuse</Link></li>
      </ul>
      <p>Sponsoring doesn't unlock anything. Everything is already unlocked.</p>
    </PageShell>
  );
}
