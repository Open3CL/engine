// this file is generated — do not edit it

/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 *
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 *
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 *
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 *
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 *
 * You can override `.env` values from the command line like so:
 *
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
  export const GSM_SKIP_SSH_AGENT_WORKAROUND: string;
  export const LC_TIME: string;
  export const GJS_DEBUG_TOPICS: string;
  export const SNAP_LIBRARY_PATH: string;
  export const GJS_DEBUG_OUTPUT: string;
  export const GNOME_SHELL_SESSION_MODE: string;
  export const FORCE_COLOR: string;
  export const SNAP_NAME: string;
  export const PATH: string;
  export const CLUTTER_DISABLE_MIPMAPPED_TEXT: string;
  export const LOGNAME: string;
  export const XDG_MENU_PREFIX: string;
  export const XDG_ACTIVATION_TOKEN: string;
  export const WAYLAND_DISPLAY: string;
  export const XAUTHORITY: string;
  export const LC_PAPER: string;
  export const LC_MEASUREMENT: string;
  export const SNAP_ARCH: string;
  export const XMODIFIERS: string;
  export const npm_config_color: string;
  export const GIO_LAUNCHED_DESKTOP_FILE_PID: string;
  export const SNAP_REVISION: string;
  export const GIO_LAUNCHED_DESKTOP_FILE: string;
  export const QT_ACCESSIBILITY: string;
  export const SNAP_INSTANCE_NAME: string;
  export const SNAP_USER_DATA: string;
  export const XDG_SESSION_DESKTOP: string;
  export const DBUS_SESSION_BUS_ADDRESS: string;
  export const LC_TELEPHONE: string;
  export const GNOME_SETUP_DISPLAY: string;
  export const INVOCATION_ID: string;
  export const LC_ADDRESS: string;
  export const USERNAME: string;
  export const SHLVL: string;
  export const XDG_DATA_DIRS: string;
  export const SHELL: string;
  export const DEBUG_COLORS: string;
  export const SESSION_MANAGER: string;
  export const GTK_MODULES: string;
  export const XDG_SESSION_CLASS: string;
  export const COLORTERM: string;
  export const LC_IDENTIFICATION: string;
  export const SNAP_REAL_HOME: string;
  export const DISPLAY: string;
  export const HOME: string;
  export const MEMORY_PRESSURE_WATCH: string;
  export const XDG_CURRENT_DESKTOP: string;
  export const SNAP_UID: string;
  export const SNAP_EUID: string;
  export const QT_IM_MODULE: string;
  export const LC_NAME: string;
  export const LC_NUMERIC: string;
  export const MOCHA_COLORS: string;
  export const LANG: string;
  export const GDMSESSION: string;
  export const GNOME_DESKTOP_SESSION_ID: string;
  export const SNAP_COOKIE: string;
  export const SNAP_VERSION: string;
  export const SNAP_COMMON: string;
  export const MEMORY_PRESSURE_WRITE: string;
  export const SYSTEMD_EXEC_PID: string;
  export const SSH_AUTH_SOCK: string;
  export const XDG_RUNTIME_DIR: string;
  export const OLDPWD: string;
  export const SNAP_DATA: string;
  export const MANAGERPID: string;
  export const SNAP_REEXEC: string;
  export const DESKTOP_SESSION: string;
  export const USER: string;
  export const SNAP_USER_COMMON: string;
  export const XDG_SESSION_TYPE: string;
  export const SNAP_INSTANCE_KEY: string;
  export const LC_MONETARY: string;
  export const PWD: string;
  export const _: string;
  export const JOURNAL_STREAM: string;
  export const SNAP: string;
  export const SNAP_CONTEXT: string;
  export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 *
 * Values are replaced statically at build time.
 *
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
  export const PUBLIC_REPORTS_URL: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 *
 * This module cannot be imported into client-side code.
 *
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 *
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
  export const env: {
    GSM_SKIP_SSH_AGENT_WORKAROUND: string;
    LC_TIME: string;
    GJS_DEBUG_TOPICS: string;
    SNAP_LIBRARY_PATH: string;
    GJS_DEBUG_OUTPUT: string;
    GNOME_SHELL_SESSION_MODE: string;
    FORCE_COLOR: string;
    SNAP_NAME: string;
    PATH: string;
    CLUTTER_DISABLE_MIPMAPPED_TEXT: string;
    LOGNAME: string;
    XDG_MENU_PREFIX: string;
    XDG_ACTIVATION_TOKEN: string;
    WAYLAND_DISPLAY: string;
    XAUTHORITY: string;
    LC_PAPER: string;
    LC_MEASUREMENT: string;
    SNAP_ARCH: string;
    XMODIFIERS: string;
    npm_config_color: string;
    GIO_LAUNCHED_DESKTOP_FILE_PID: string;
    SNAP_REVISION: string;
    GIO_LAUNCHED_DESKTOP_FILE: string;
    QT_ACCESSIBILITY: string;
    SNAP_INSTANCE_NAME: string;
    SNAP_USER_DATA: string;
    XDG_SESSION_DESKTOP: string;
    DBUS_SESSION_BUS_ADDRESS: string;
    LC_TELEPHONE: string;
    GNOME_SETUP_DISPLAY: string;
    INVOCATION_ID: string;
    LC_ADDRESS: string;
    USERNAME: string;
    SHLVL: string;
    XDG_DATA_DIRS: string;
    SHELL: string;
    DEBUG_COLORS: string;
    SESSION_MANAGER: string;
    GTK_MODULES: string;
    XDG_SESSION_CLASS: string;
    COLORTERM: string;
    LC_IDENTIFICATION: string;
    SNAP_REAL_HOME: string;
    DISPLAY: string;
    HOME: string;
    MEMORY_PRESSURE_WATCH: string;
    XDG_CURRENT_DESKTOP: string;
    SNAP_UID: string;
    SNAP_EUID: string;
    QT_IM_MODULE: string;
    LC_NAME: string;
    LC_NUMERIC: string;
    MOCHA_COLORS: string;
    LANG: string;
    GDMSESSION: string;
    GNOME_DESKTOP_SESSION_ID: string;
    SNAP_COOKIE: string;
    SNAP_VERSION: string;
    SNAP_COMMON: string;
    MEMORY_PRESSURE_WRITE: string;
    SYSTEMD_EXEC_PID: string;
    SSH_AUTH_SOCK: string;
    XDG_RUNTIME_DIR: string;
    OLDPWD: string;
    SNAP_DATA: string;
    MANAGERPID: string;
    SNAP_REEXEC: string;
    DESKTOP_SESSION: string;
    USER: string;
    SNAP_USER_COMMON: string;
    XDG_SESSION_TYPE: string;
    SNAP_INSTANCE_KEY: string;
    LC_MONETARY: string;
    PWD: string;
    _: string;
    JOURNAL_STREAM: string;
    SNAP: string;
    SNAP_CONTEXT: string;
    NODE_ENV: string;
    [key: `PUBLIC_${string}`]: undefined;
    [key: `${string}`]: string | undefined;
  };
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 *
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 *
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
  export const env: {
    PUBLIC_REPORTS_URL: string;
    [key: `PUBLIC_${string}`]: string | undefined;
  };
}
