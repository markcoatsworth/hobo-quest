import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// The dev server's own port, kept clear of the other projects here
// (voyageurs on 5173, motion-tracker on 5175) so they can all run at once.
const PORT = 5174;

// ------------------------------------------------- the phone link over Wi-Fi
//
// `npm run dev` listens on every network address, so a phone on the same
// Wi-Fi can play. On a Mac or plain Linux, Vite's own "Network:" line is
// that link. Here, though, the dev server runs inside WSL2, behind a virtual
// network the phone can't see: its only address is a 172.x one. The phone
// goes through Windows instead, which forwards the port into WSL (a netsh
// "portproxy" rule, set up once, outside the repo). So ask Windows for its
// Wi-Fi address, check the forwarding still points at WSL (WSL's address
// changes when Windows restarts), and print the link, or how to fix it.

const WINDOWS = '/mnt/c/Windows/System32';

function run(exe, args = []) {
  try {
    return execFileSync(`${WINDOWS}/${exe}`, args, { encoding: 'utf8', timeout: 4000 }).replace(/\r/g, '');
  } catch {
    return null;
  }
}

/** The Windows Wi-Fi adapter's IPv4 address, or null (not WSL, no Wi-Fi). */
function windowsWifiAddress() {
  const out = run('ipconfig.exe');
  if (!out) return null;
  // Adapter headers start in column 0, their details are indented beneath.
  // Only the adapter named exactly "Wi-Fi" ("Local Area Connection* N" are
  // Wi-Fi Direct and the like, never the one the phone is on).
  let inWifi = false;
  for (const line of out.split('\n')) {
    if (/^\S/.test(line)) inWifi = /adapter Wi-Fi:\s*$/.test(line);
    else if (inWifi) {
      const m = line.match(/IPv4 Address[ .]*:\s*([\d.]+)/);
      if (m) return m[1];
    }
  }
  return null;
}

/** WSL's own address, the one Windows has to forward to. */
function wslAddress() {
  return networkInterfaces().eth0?.find((a) => a.family === 'IPv4')?.address ?? null;
}

/** Where Windows forwards our port to, or null if it doesn't. */
function forwardedTo(port) {
  const out = run('netsh.exe', ['interface', 'portproxy', 'show', 'v4tov4']);
  for (const line of out?.split('\n') ?? []) {
    const [, listenPort, connectAddr] = line.trim().split(/\s+/);
    if (listenPort === String(port)) return connectAddr;
  }
  return null;
}

function wifiUrlPlugin() {
  return {
    name: 'hobo-quest-wifi-url',
    apply: 'serve',
    configureServer(server) {
      const printUrls = server.printUrls.bind(server);
      server.printUrls = () => {
        printUrls();
        if (!existsSync(WINDOWS)) return; // not WSL: Vite's Network line is the phone link
        if (!server.resolvedUrls?.network?.length) return; // not exposed (no --host)
        const log = server.config.logger;
        const wifi = windowsWifiAddress();
        const wsl = wslAddress();
        if (!wifi || !wsl) return;
        const target = forwardedTo(PORT);
        if (target === wsl) {
          log.info(`  \x1b[32m➜\x1b[0m  \x1b[1mPhone\x1b[0m:   \x1b[36mhttp://${wifi}:${PORT}/\x1b[0m  (same Wi-Fi)`);
          return;
        }
        log.warn(
          [
            target
              ? `  ➜  Phone:   Windows forwards port ${PORT} to ${target}, but WSL is now at ${wsl} (it moves when Windows restarts).`
              : `  ➜  Phone:   Windows isn't forwarding port ${PORT} into WSL yet.`,
            `     To play on a phone at http://${wifi}:${PORT}/, run this once in an Administrator PowerShell:`,
            `       netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=${PORT} connectaddress=${wsl} connectport=${PORT}`,
            ...(target
              ? []
              : [`       New-NetFirewallRule -DisplayName "Hobo Quest dev ${PORT}" -Direction Inbound -Protocol TCP -LocalPort ${PORT} -Action Allow`]),
            '     then restart npm run dev.',
          ].join('\n'),
        );
      };
    },
  };
}

export default defineConfig({
  // Relative asset paths, so dist/ works from any subfolder (itch.io etc.).
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  // Every network address (the phone needs this), always this port: the
  // Windows forwarding is for this port only.
  server: { host: true, port: PORT, strictPort: true },
  plugins: [wifiUrlPlugin()],
});
