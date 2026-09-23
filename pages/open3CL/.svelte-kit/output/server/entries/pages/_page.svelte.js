import {
  x as attributes,
  y as clsx$1,
  z as attr_class,
  w as attr,
  F as bind_props,
  G as spread_props,
  J as element,
  K as ensure_array_like,
  N as slot,
  O as sanitize_props,
  P as rest_props,
  Q as stringify$1,
  T as attr_style,
  V as sanitize_slots
} from '../../chunks/index.js';
import clsx from 'clsx';
import { tv } from 'tailwind-variants';
import {
  l as ssr_context,
  n as noop$2,
  j as getContext,
  s as setContext,
  m as run,
  k as escape_html,
  p as fallback
} from '../../chunks/context.js';
import {
  parseJSONPointer,
  compileJSONPointer,
  getIn,
  updateIn,
  setIn,
  immutableJSONPatch,
  isJSONPatchAdd,
  isJSONPatchRemove,
  isJSONPatchReplace,
  parsePath,
  isJSONPatchCopy,
  isJSONPatchMove,
  isJSONArray,
  isJSONObject,
  deleteIn,
  existsIn,
  revertJSONPatch,
  appendToJSONPointer
} from 'immutable-json-patch';
import jsonSourceMap from 'json-source-map';
import { jsonrepair } from 'jsonrepair';
import { jsonquery, stringify, parse } from '@jsonquerylang/jsonquery';
import { faCheckSquare, faSquare, faClock, faLightbulb } from '@fortawesome/free-regular-svg-icons';
import {
  sortBy,
  initial,
  last,
  first,
  isEmpty,
  isEqual,
  noop as noop$3,
  cloneDeepWith,
  times,
  range,
  debounce,
  partition,
  groupBy,
  mapValues,
  uniqueId as uniqueId$1,
  cloneDeep
} from 'lodash-es';
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
  faTimes,
  faCog,
  faExclamationTriangle,
  faAngleDown,
  faCheck,
  faArrowDown,
  faWrench,
  faCaretDown,
  faCaretRight,
  faSortAmountDownAlt,
  faFilter,
  faEllipsisV,
  faUndo,
  faRedo,
  faCopy,
  faSearch,
  faAngleRight,
  faEdit,
  faCircleNotch,
  faChevronDown,
  faChevronUp,
  faPen,
  faCheckSquare as faCheckSquare$1,
  faSquare as faSquare$1,
  faCut,
  faPaste,
  faClone,
  faCropAlt,
  faTrashCan,
  faArrowRightArrowLeft,
  faPlus,
  faCaretSquareUp,
  faCaretSquareDown,
  faCode,
  faEye,
  faCaretUp,
  faRotate,
  faCaretLeft
} from '@fortawesome/free-solid-svg-icons';
import { computePosition, autoUpdate, offset, flip, shift } from '@floating-ui/dom';
import naturalCompare from 'natural-compare-lite';
import memoizeOne from 'memoize-one';
import '@lezer/common';
import { Compartment, Annotation, EditorSelection, ChangeSet } from '@codemirror/state';
import 'codemirror-wrapped-line-indent/dist/index.js';
import { calcul_3cl } from '@open3cl/engine';
import { set_tv_match_optimized_version, set_bug_for_bug_compat } from '@open3cl/engine/utils.js';
import { XMLParser } from 'fast-xml-parser';
function html(value) {
  var html2 = String(value ?? '');
  var open = '<!---->';
  return open + html2 + '<!---->';
}
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function createEventDispatcher() {
  return noop$2;
}
async function tick() {}
function getTheme(componentKey) {
  const theme = getContext('theme');
  return theme?.[componentKey];
}
const accordion = tv({
  base: 'w-full',
  variants: {
    color: {
      primary: 'text-primary-500 dark:text-primary-400',
      secondary: 'text-secondary-500 dark:text-secondary-400'
    },
    flush: {
      true: '',
      false: 'border border-gray-200 dark:border-gray-700 rounded-t-xl'
    }
  }
});
const accordionItem = tv({
  slots: {
    base: 'group',
    button:
      'flex items-center justify-between w-full font-medium text-left group-first:rounded-t-xl border-gray-200 dark:border-gray-700 border-b',
    content: 'border-b border-gray-200 dark:border-gray-700',
    active:
      'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800',
    inactive: 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  },
  variants: {
    flush: {
      true: {
        button: 'py-5',
        content: 'py-5'
      },
      false: {
        button: 'p-5 border-s border-e group-first:border-t',
        content: 'p-5 border-s border-e'
      }
    },
    open: {
      true: {},
      false: {}
    }
  },
  compoundVariants: [
    {
      flush: true,
      open: true,
      class: {
        button: 'text-gray-900 dark:text-white'
      }
    },
    {
      flush: true,
      open: false,
      class: {
        button: 'text-gray-500 dark:text-gray-400'
      }
    }
  ],
  defaultVariants: {
    flush: false,
    open: false
  }
});
const SINGLE_SELECTION_KEY = Symbol('singleton');
function createSingleSelectionContext(nonReactive = false) {
  if (nonReactive) return setContext(SINGLE_SELECTION_KEY, {});
  const context = { value: null };
  return setContext(SINGLE_SELECTION_KEY, context);
}
function setSelected(context, open, value) {
  if (open) context.value = value ?? null;
  else if (context.value === value) context.value = null;
  return context;
}
function useSingleSelection(callback) {
  const context = getContext(SINGLE_SELECTION_KEY) ?? createSingleSelectionContext(false);
  if (!context.hasOwnProperty?.('value')) return () => context;
  return (open, v) => run(() => setSelected(context, open, v));
}
function Accordion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      flush,
      activeClass,
      inactiveClass,
      multiple = false,
      class: className,
      transitionType,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const theme = getTheme('accordion');
    const ctx = { flush, activeClass, inactiveClass, transitionType };
    setContext('ctx', ctx);
    createSingleSelectionContext(multiple);
    const base = accordion({ flush, class: clsx(theme, className) });
    $$renderer2.push(`<div${attributes({ ...restProps, class: clsx$1(base) })}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
const linear = (x) => x;
function cubic_out(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function split_css_unit(value) {
  const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
  return split
    ? [parseFloat(split[1]), split[2] || 'px']
    : [
        /** @type {number} */
        value,
        'px'
      ];
}
function fade(node, { delay = 0, duration = 400, easing = linear } = {}) {
  const o = +getComputedStyle(node).opacity;
  return {
    delay,
    duration,
    easing,
    css: (t) => `opacity: ${t * o}`
  };
}
function fly(
  node,
  { delay = 0, duration = 400, easing = cubic_out, x = 0, y = 0, opacity = 0 } = {}
) {
  const style = getComputedStyle(node);
  const target_opacity = +style.opacity;
  const transform = style.transform === 'none' ? '' : style.transform;
  const od = target_opacity * (1 - opacity);
  const [x_value, x_unit] = split_css_unit(x);
  const [y_value, y_unit] = split_css_unit(y);
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x_value}${x_unit}, ${(1 - t) * y_value}${y_unit});
			opacity: ${target_opacity - od * u}`
  };
}
function slide(node, { delay = 0, duration = 400, easing = cubic_out, axis = 'y' } = {}) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const primary_property = axis === 'y' ? 'height' : 'width';
  const primary_property_value = parseFloat(style[primary_property]);
  const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
  const capitalized_secondary_properties = secondary_properties.map(
    (e) =>
      /** @type {'Left' | 'Right' | 'Top' | 'Bottom'} */
      `${e[0].toUpperCase()}${e.slice(1)}`
  );
  const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
  const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
  const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
  const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
  const border_width_start_value = parseFloat(
    style[`border${capitalized_secondary_properties[0]}Width`]
  );
  const border_width_end_value = parseFloat(
    style[`border${capitalized_secondary_properties[1]}Width`]
  );
  return {
    delay,
    duration,
    easing,
    css: (t) =>
      `overflow: hidden;opacity: ${Math.min(t * 20, 1) * opacity};${primary_property}: ${t * primary_property_value}px;padding-${secondary_properties[0]}: ${t * padding_start_value}px;padding-${secondary_properties[1]}: ${t * padding_end_value}px;margin-${secondary_properties[0]}: ${t * margin_start_value}px;margin-${secondary_properties[1]}: ${t * margin_end_value}px;border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;min-${primary_property}: 0`
  };
}
function AccordionItem($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      header,
      arrowup,
      arrowdown,
      open = false,
      activeClass,
      inactiveClass,
      transitionType = slide,
      transitionParams,
      class: className,
      classes,
      headerClass,
      contentClass
    } = $$props;
    let styling = classes ?? {
      button: headerClass,
      content: contentClass,
      active: activeClass,
      inactive: inactiveClass
    };
    const ctx = getContext('ctx') ?? {};
    const ctxTransitionType = ctx.transitionType ?? transitionType;
    const useTransition =
      transitionType === 'none' ? false : ctxTransitionType === 'none' ? false : true;
    const theme = getTheme('accordionItem');
    useSingleSelection();
    const {
      base,
      button: button2,
      content,
      active,
      inactive
    } = accordionItem({ flush: ctx.flush, open });
    let buttonClass = clsx(
      open && !ctx.flush && (styling.active || ctx.activeClass || active()),
      !open && !ctx.flush && (styling.inactive || ctx.inactiveClass || inactive())
    );
    $$renderer2.push(
      `<h2${attr_class(clsx$1(base({ class: clsx(theme?.base, className) })))}><button type="button"${attr_class(clsx$1(button2({ class: clsx(buttonClass, theme?.button, styling.button) })))}${attr('aria-expanded', open)}>`
    );
    if (header) {
      $$renderer2.push('<!--[-->');
      header($$renderer2);
      $$renderer2.push(`<!----> `);
      if (open) {
        $$renderer2.push('<!--[-->');
        if (!arrowup) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<svg class="h-3 w-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"></path></svg>`
          );
        } else {
          $$renderer2.push('<!--[!-->');
          arrowup($$renderer2);
          $$renderer2.push(`<!---->`);
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push('<!--[!-->');
        if (!arrowdown) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<svg class="h-3 w-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"></path></svg>`
          );
        } else {
          $$renderer2.push('<!--[!-->');
          arrowdown($$renderer2);
          $$renderer2.push(`<!---->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></button></h2> `);
    if (useTransition) {
      $$renderer2.push('<!--[-->');
      if (open && transitionType !== 'none') {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<div><div${attr_class(clsx$1(content({ class: clsx(theme?.content, styling.content) })))}>`
        );
        children($$renderer2);
        $$renderer2.push(`<!----></div></div>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push('<!--[!-->');
      $$renderer2.push(
        `<div${attr_class(clsx$1(open ? 'block' : 'hidden'))}><div${attr_class(clsx$1(content({ class: clsx(theme?.content, styling.content) })))}>`
      );
      children($$renderer2);
      $$renderer2.push(`<!----></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { open });
  });
}
tv({
  base: 'p-4 gap-3 text-sm',
  variants: {
    color: {
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: 'bg-primary-50 dark:bg-gray-800 text-primary-800 dark:text-primary-400',
      secondary: 'bg-secondary-50 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-400',
      gray: 'bg-gray-100 text-gray-500 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-300',
      red: 'bg-red-100 text-red-500 focus:ring-red-400 dark:bg-red-200 dark:text-red-600',
      orange:
        'bg-orange-100 text-orange-500 focus:ring-orange-400 dark:bg-orange-200 dark:text-orange-600',
      amber:
        'bg-amber-100 text-amber-500 focus:ring-amber-400 dark:bg-amber-200 dark:text-amber-600',
      yellow:
        'bg-yellow-100 text-yellow-500 focus:ring-yellow-400 dark:bg-yellow-200 dark:text-yellow-600',
      lime: 'bg-lime-100 text-lime-500 focus:ring-lime-400 dark:bg-lime-200 dark:text-lime-600',
      green:
        'bg-green-100 text-green-500 focus:ring-green-400 dark:bg-green-200 dark:text-green-600',
      emerald:
        'bg-emerald-100 text-emerald-500 focus:ring-emerald-400 dark:bg-emerald-200 dark:text-emerald-600',
      teal: 'bg-teal-100 text-teal-500 focus:ring-teal-400 dark:bg-teal-200 dark:text-teal-600',
      cyan: 'bg-cyan-100 text-cyan-500 focus:ring-cyan-400 dark:bg-cyan-200 dark:text-cyan-600',
      sky: 'bg-sky-100 text-sky-500 focus:ring-sky-400 dark:bg-sky-200 dark:text-sky-600',
      blue: 'bg-blue-100 text-blue-500 focus:ring-blue-400 dark:bg-blue-200 dark:text-blue-600',
      indigo:
        'bg-indigo-100 text-indigo-500 focus:ring-indigo-400 dark:bg-indigo-200 dark:text-indigo-600',
      violet:
        'bg-violet-100 text-violet-500 focus:ring-violet-400 dark:bg-violet-200 dark:text-violet-600',
      purple:
        'bg-purple-100 text-purple-500 focus:ring-purple-400 dark:bg-purple-200 dark:text-purple-600',
      fuchsia:
        'bg-fuchsia-100 text-fuchsia-500 focus:ring-fuchsia-400 dark:bg-fuchsia-200 dark:text-fuchsia-600',
      pink: 'bg-pink-100 text-pink-500 focus:ring-pink-400 dark:bg-pink-200 dark:text-pink-600',
      rose: 'bg-rose-100 text-rose-500 focus:ring-rose-400 dark:bg-rose-200 dark:text-rose-600'
    },
    rounded: {
      true: 'rounded-lg'
    },
    border: {
      true: 'border'
    },
    icon: {
      true: 'flex items-center'
    },
    dismissable: {
      true: 'flex items-center'
    }
  },
  compoundVariants: [
    // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
    {
      border: true,
      color: 'primary',
      class: 'border-primary-500 dark:border-primary-200 divide-primary-500 dark:divide-primary-200'
    },
    {
      border: true,
      color: 'secondary',
      class:
        'border-secondary-500 dark:border-secondary-200 divide-secondary-500 dark:divide-secondary-200'
    },
    {
      border: true,
      color: 'gray',
      class: 'border-gray-300 dark:border-gray-800 divide-gray-300 dark:divide-gray-800'
    },
    {
      border: true,
      color: 'red',
      class: 'border-red-300 dark:border-red-800 divide-red-300 dark:divide-red-800'
    },
    {
      border: true,
      color: 'orange',
      class: 'border-orange-300 dark:border-orange-800 divide-orange-300 dark:divide-orange-800'
    },
    {
      border: true,
      color: 'amber',
      class: 'border-amber-300 dark:border-amber-800 divide-amber-300 dark:divide-amber-800'
    },
    {
      border: true,
      color: 'yellow',
      class: 'border-yellow-300 dark:border-yellow-800 divide-yellow-300 dark:divide-yellow-800'
    },
    {
      border: true,
      color: 'lime',
      class: 'border-lime-300 dark:border-lime-800 divide-lime-300 dark:divide-lime-800'
    },
    {
      border: true,
      color: 'green',
      class: 'border-green-300 dark:border-green-800 divide-green-300 dark:divide-green-800'
    },
    {
      border: true,
      color: 'emerald',
      class: 'border-emerald-300 dark:border-emerald-800 divide-emerald-300 dark:divide-emerald-800'
    },
    {
      border: true,
      color: 'teal',
      class: 'border-teal-300 dark:border-teal-800 divide-teal-300 dark:divide-teal-800'
    },
    {
      border: true,
      color: 'cyan',
      class: 'border-cyan-300 dark:border-cyan-800 divide-cyan-300 dark:divide-cyan-800'
    },
    {
      border: true,
      color: 'sky',
      class: 'border-sky-300 dark:border-sky-800 divide-sky-300 dark:divide-sky-800'
    },
    {
      border: true,
      color: 'blue',
      class: 'border-blue-300 dark:border-blue-800 divide-blue-300 dark:divide-blue-800'
    },
    {
      border: true,
      color: 'indigo',
      class: 'border-indigo-300 dark:border-indigo-800 divide-indigo-300 dark:divide-indigo-800'
    },
    //  violet, purple, fuchsia, pink, rose
    {
      border: true,
      color: 'violet',
      class: 'border-violet-300 dark:border-violet-800 divide-violet-300 dark:divide-violet-800'
    },
    {
      border: true,
      color: 'purple',
      class: 'border-purple-300 dark:border-purple-800 divide-purple-300 dark:divide-purple-800'
    },
    {
      border: true,
      color: 'fuchsia',
      class: 'border-fuchsia-300 dark:border-fuchsia-800 divide-fuchsia-300 dark:divide-fuchsia-800'
    },
    {
      border: true,
      color: 'pink',
      class: 'border-pink-300 dark:border-pink-800 divide-pink-300 dark:divide-pink-800'
    },
    {
      border: true,
      color: 'rose',
      class: 'border-rose-300 dark:border-rose-800 divide-rose-300 dark:divide-rose-800'
    }
  ],
  defaultVariants: {
    color: 'primary',
    rounded: true
  }
});
const closeButton = tv({
  base: 'focus:outline-hidden whitespace-normal disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
    color: {
      primary:
        'text-primary-500 focus:ring-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800 dark:hover:text-primary-300',
      secondary:
        'text-secondary-500 focus:ring-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-800 dark:hover:text-secondary-300',
      gray: 'text-gray-500 focus:ring-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-300',
      red: 'text-red-500 focus:ring-red-400 hover:bg-red-200 dark:hover:bg-red-800 dark:hover:text-red-300',
      orange:
        'text-orange-500 focus:ring-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800 dark:hover:text-orange-300',
      amber:
        'text-amber-500 focus:ring-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800 dark:hover:text-amber-300',
      yellow:
        'text-yellow-500 focus:ring-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800 dark:hover:text-yellow-300',
      lime: 'text-lime-500 focus:ring-lime-400 hover:bg-lime-200 dark:hover:bg-lime-800 dark:hover:text-lime-300',
      green:
        'text-green-500 focus:ring-green-400 hover:bg-green-200 dark:hover:bg-green-800 dark:hover:text-green-300',
      emerald:
        'text-emerald-500 focus:ring-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800 dark:hover:text-emerald-300',
      teal: 'text-teal-500 focus:ring-teal-400 hover:bg-teal-200 dark:hover:bg-teal-800 dark:hover:text-teal-300',
      cyan: 'text-cyan-500 focus:ring-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-800 dark:hover:text-cyan-300',
      sky: 'text-sky-500 focus:ring-sky-400 hover:bg-sky-200 dark:hover:bg-sky-800 dark:hover:text-sky-300',
      blue: 'text-blue-500 focus:ring-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 dark:hover:text-blue-300',
      indigo:
        'text-indigo-500 focus:ring-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 dark:hover:text-indigo-300',
      violet:
        'text-violet-500 focus:ring-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800 dark:hover:text-violet-300',
      purple:
        'text-purple-500 focus:ring-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 dark:hover:text-purple-300',
      fuchsia:
        'text-fuchsia-500 focus:ring-fuchsia-400 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800 dark:hover:text-fuchsia-300',
      pink: 'text-pink-500 focus:ring-pink-400 hover:bg-pink-200 dark:hover:bg-pink-800 dark:hover:text-pink-300',
      rose: 'text-rose-500 focus:ring-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800 dark:hover:text-rose-300',
      none: ''
    },
    size: {
      xs: 'm-0.5 rounded-xs focus:ring-1 p-0.5',
      sm: 'm-0.5 rounded-sm focus:ring-1 p-0.5',
      md: 'm-0.5 rounded-lg focus:ring-2 p-1.5',
      lg: 'm-0.5 rounded-lg focus:ring-2 p-2.5'
    }
  },
  defaultVariants: {
    color: 'gray',
    size: 'md',
    href: null
  },
  slots: {
    svg: ''
  },
  compoundVariants: [
    {
      size: 'xs',
      class: {
        svg: 'w-3 h-3'
      }
    },
    {
      size: 'sm',
      class: {
        svg: 'w-3.5 h-3.5'
      }
    },
    {
      size: ['md', 'lg'],
      class: {
        svg: 'w-5 h-5'
      }
    },
    {
      size: ['xs', 'sm', 'md', 'lg'],
      color: 'none',
      class: 'focus:ring-0 rounded-none m-0'
    }
  ]
});
const DISMISSABLE_KEY = Symbol('dismissable');
function createDismissableContext(onDismiss) {
  const context = {
    dismiss: onDismiss
  };
  return setContext(DISMISSABLE_KEY, context);
}
function useDismiss() {
  const context = getContext(DISMISSABLE_KEY);
  return context;
}
function CloseButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      color = 'gray',
      onclick: onclickorg,
      name = 'Close',
      ariaLabel,
      size = 'md',
      class: className,
      svgClass,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const { base, svg } = closeButton({ color, size });
    useDismiss();
    if (restProps.href === void 0) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<button${attributes({
          type: 'button',
          ...restProps,
          class: clsx$1(base({ class: clsx(className) })),
          'aria-label': ariaLabel ?? name
        })}>`
      );
      if (name) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<span class="sr-only">${escape_html(name)}</span>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--> `);
      if (children) {
        $$renderer2.push('<!--[-->');
        children($$renderer2);
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `<svg${attr_class(clsx$1(svg({ class: svgClass })))} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`
        );
      }
      $$renderer2.push(`<!--]--></button>`);
    } else {
      $$renderer2.push('<!--[!-->');
      $$renderer2.push(
        `<a${attributes({
          ...restProps,
          class: clsx$1(base({ class: clsx(className) })),
          'aria-label': ariaLabel ?? name
        })}>`
      );
      if (name) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<span class="sr-only">${escape_html(name)}</span>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--> `);
      if (children) {
        $$renderer2.push('<!--[-->');
        children($$renderer2);
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `<svg${attr_class(clsx$1(svg()))} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`
        );
      }
      $$renderer2.push(`<!--]--></a>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
tv({
  base: 'relative flex items-center justify-center bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300',
  variants: {
    cornerStyle: {
      rounded: 'rounded-sm',
      circular: 'rounded-full'
    },
    border: {
      true: 'p-1 ring-2 ring-gray-300 dark:ring-gray-500',
      false: ''
    },
    stacked: {
      true: 'border-2 not-first:-ms-4 border-white dark:border-gray-800',
      false: ''
    },
    size: {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-20 h-20',
      xl: 'w-36 h-36'
    }
  },
  defaultVariants: {
    cornerStyle: 'circular',
    border: false,
    stacked: false,
    size: 'md'
  }
});
tv({
  base: 'shrink-0',
  variants: {
    color: {
      // 'primary' secondary 'gray' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'
      primary: 'bg-primary-500',
      secondary: 'bg-secondary-500',
      gray: 'bg-gray-200',
      red: 'bg-red-500',
      orange: 'bg-orange-600',
      amber: 'bg-amber-500',
      yellow: 'bg-yellow-300',
      lime: 'bg-lime-500',
      green: 'bg-green-500',
      emerald: 'bg-emerald-500',
      teal: 'bg-teal-500',
      cyan: 'bg-cyan-500',
      sky: 'bg-sky-500',
      blue: 'bg-blue-500',
      indigo: 'bg-indigo-500',
      violet: 'bg-violet-500',
      purple: 'bg-purple-500',
      fuchsia: 'bg-fuchsia-500',
      pink: 'bg-pink-500',
      rose: 'bg-rose-500'
    },
    size: {
      xs: 'w-2 h-2',
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-3.5 h-3.5',
      xl: 'w-6 h-6'
    },
    cornerStyle: {
      rounded: 'rounded-sm',
      circular: 'rounded-full'
    },
    border: {
      true: 'border border-gray-300 dark:border-gray-300',
      false: {}
    },
    hasChildren: {
      true: 'inline-flex items-center justify-center',
      false: {}
    },
    placement: {
      default: '',
      'top-left': 'absolute top-0 start-0',
      'top-center': 'absolute top-0 start-1/2 -translate-x-1/2 rtl:translate-x-1/2',
      'top-right': 'absolute top-0 end-0',
      'center-left': 'absolute top-1/2 -translate-y-1/2 start-0',
      center: 'absolute top-1/2 -translate-y-1/2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2',
      'center-right': 'absolute top-1/2 -translate-y-1/2 end-0',
      'bottom-left': 'absolute bottom-0 start-0',
      'bottom-center': 'absolute bottom-0 start-1/2 -translate-x-1/2 rtl:translate-x-1/2',
      'bottom-right': 'absolute bottom-0 end-0'
    },
    offset: {
      true: {},
      false: {}
    }
  },
  compoundVariants: [
    {
      placement: 'top-left',
      offset: true,
      class: '-translate-x-1/3 rtl:translate-x-1/3 -translate-y-1/3'
    },
    {
      placement: 'top-center',
      offset: true,
      class: '-translate-y-1/3'
    },
    {
      placement: 'top-right',
      offset: true,
      class: 'translate-x-1/3 rtl:-translate-x-1/3 -translate-y-1/3'
    },
    {
      placement: 'center-left',
      offset: true,
      class: '-translate-x-1/3 rtl:translate-x-1/3'
    },
    {
      placement: 'center-right',
      offset: true,
      class: 'translate-x-1/3 rtl:-translate-x-1/3'
    },
    {
      placement: 'bottom-left',
      offset: true,
      class: '-translate-x-1/3 rtl:translate-x-1/3 translate-y-1/3'
    },
    {
      placement: 'bottom-center',
      offset: true,
      class: 'translate-y-1/3'
    },
    {
      placement: 'bottom-right',
      offset: true,
      class: 'translate-x-1/3 rtl:-translate-x-1/3 translate-y-1/3'
    }
  ],
  defaultVariants: {
    color: 'primary',
    size: 'md',
    cornerStyle: 'circular',
    border: false,
    offset: true,
    hasChildren: false
  }
});
const badge = tv({
  slots: {
    linkClass: 'flex align-middle',
    base: 'font-medium inline-flex items-center justify-center px-2.5 py-0.5'
  },
  variants: {
    color: {
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: {
        base: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
      },
      secondary: {
        base: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300'
      },
      gray: { base: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
      red: { base: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
      orange: { base: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
      amber: { base: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
      yellow: { base: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      lime: { base: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300' },
      green: { base: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      emerald: {
        base: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
      },
      teal: { base: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
      cyan: { base: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300' },
      sky: { base: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300' },
      blue: { base: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      indigo: { base: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
      violet: { base: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300' },
      fuchsia: {
        base: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300'
      },
      purple: { base: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      pink: { base: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300' },
      rose: { base: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300' }
    },
    size: {
      small: 'text-xs',
      large: 'text-sm'
    },
    border: {
      true: { base: 'border' }
    },
    rounded: {
      true: { base: 'rounded-full' },
      false: 'rounded-sm'
    }
  },
  compoundVariants: [
    {
      border: true,
      color: 'primary',
      class: 'dark:bg-transparent dark:text-primary-400 border-primary-400 dark:border-primary-400'
    },
    {
      border: true,
      color: 'secondary',
      class:
        'dark:bg-transparent dark:text-secondary-400 border-secondary-400 dark:border-secondary-400'
    },
    {
      border: true,
      color: 'gray',
      class: 'dark:bg-transparent dark:text-gray-400 border-gray-400 dark:border-gray-400'
    },
    {
      border: true,
      color: 'red',
      class: 'dark:bg-transparent dark:text-red-400 border-red-400 dark:border-red-400'
    },
    {
      border: true,
      color: 'orange',
      class: 'dark:bg-transparent dark:text-orange-400 border-orange-400 dark:border-orange-400'
    },
    {
      border: true,
      color: 'amber',
      class: 'dark:bg-transparent dark:text-amber-400 border-amber-400 dark:border-amber-400'
    },
    {
      border: true,
      color: 'yellow',
      class: 'dark:bg-transparent dark:text-yellow-300 border-yellow-300 dark:border-yellow-300'
    },
    {
      border: true,
      color: 'lime',
      class: 'dark:bg-transparent dark:text-lime-400 border-lime-400 dark:border-lime-400'
    },
    {
      border: true,
      color: 'green',
      class: 'dark:bg-transparent dark:text-green-400 border-green-400 dark:border-green-400'
    },
    {
      border: true,
      color: 'emerald',
      class: 'dark:bg-transparent dark:text-emerald-400 border-emerald-400 dark:border-emerald-400'
    },
    {
      border: true,
      color: 'teal',
      class: 'dark:bg-transparent dark:text-teal-400 border-teal-400 dark:border-teal-400'
    },
    {
      border: true,
      color: 'cyan',
      class: 'dark:bg-transparent dark:text-cyan-400 border-cyan-400 dark:border-cyan-400'
    },
    {
      border: true,
      color: 'sky',
      class: 'dark:bg-transparent dark:text-sky-400 border-sky-400 dark:border-sky-400'
    },
    {
      border: true,
      color: 'blue',
      class: 'dark:bg-transparent dark:text-blue-400 border-blue-400 dark:border-blue-400'
    },
    {
      border: true,
      color: 'indigo',
      class: 'dark:bg-transparent dark:text-indigo-400 border-indigo-400 dark:border-indigo-400'
    },
    {
      border: true,
      color: 'violet',
      class: 'dark:bg-transparent dark:text-violet-400 border-violet-400 dark:border-violet-400'
    },
    {
      border: true,
      color: 'purple',
      class: 'dark:bg-transparent dark:text-purple-400 border-purple-400 dark:border-purple-400'
    },
    {
      border: true,
      color: 'fuchsia',
      class: 'dark:bg-transparent dark:text-fuchsia-400 border-fuchsia-400 dark:border-fuchsia-400'
    },
    {
      border: true,
      color: 'pink',
      class: 'dark:bg-transparent dark:text-pink-400 border-pink-400 dark:border-pink-400'
    },
    {
      border: true,
      color: 'rose',
      class: 'dark:bg-transparent dark:text-rose-400 border-rose-400 dark:border-rose-400'
    },
    {
      href: true,
      color: 'primary',
      class: 'hover:bg-primary-200'
    },
    {
      href: true,
      color: 'secondary',
      class: 'hover:bg-secondary-200'
    },
    {
      href: true,
      color: 'gray',
      class: 'hover:bg-gray-200'
    },
    {
      href: true,
      color: 'red',
      class: 'hover:bg-red-200'
    },
    {
      href: true,
      color: 'orange',
      class: 'hover:bg-orange-200'
    },
    {
      href: true,
      color: 'amber',
      class: 'hover:bg-amber-200'
    },
    {
      href: true,
      color: 'yellow',
      class: 'hover:bg-yellow-200'
    },
    {
      href: true,
      color: 'lime',
      class: 'hover:bg-lime-200'
    },
    {
      href: true,
      color: 'green',
      class: 'hover:bg-green-200'
    },
    {
      href: true,
      color: 'emerald',
      class: 'hover:bg-emerald-200'
    },
    {
      href: true,
      color: 'teal',
      class: 'hover:bg-teal-200'
    },
    {
      href: true,
      color: 'cyan',
      class: 'hover:bg-cyan-200'
    },
    {
      href: true,
      color: 'sky',
      class: 'hover:bg-sky-200'
    },
    {
      href: true,
      color: 'blue',
      class: 'hover:bg-blue-200'
    },
    {
      href: true,
      color: 'indigo',
      class: 'hover:bg-indigo-200'
    },
    {
      href: true,
      color: 'violet',
      class: 'hover:bg-violet-200'
    },
    {
      href: true,
      color: 'purple',
      class: 'hover:bg-purple-200'
    },
    {
      href: true,
      color: 'fuchsia',
      class: 'hover:bg-fuchsia-200'
    },
    {
      href: true,
      color: 'pink',
      class: 'hover:bg-pink-200'
    },
    {
      href: true,
      color: 'rose',
      class: 'hover:bg-rose-200'
    }
  ],
  defaultVariants: {
    color: 'primary',
    size: 'small',
    rounded: false
  }
});
function Badge($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      icon,
      badgeStatus = true,
      color = 'primary',
      large = false,
      dismissable = false,
      class: className,
      classes,
      border,
      href,
      target,
      rounded,
      transition = fade,
      params,
      aClass,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const styling = classes ?? { linkClass: aClass };
    const theme = getTheme('badge');
    const { base, linkClass } = badge({ color, size: large ? 'large' : 'small', rounded, border });
    const close = () => {};
    createDismissableContext(close);
    if (badgeStatus) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div${attributes({
          ...restProps,
          class: clsx$1(base({ class: clsx(theme?.base, className) }))
        })}>`
      );
      if (href) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<a${attr('href', href)}${attr('target', target)}${attr_class(clsx$1(linkClass({ class: clsx(theme?.linkClass, styling.linkClass) })))}>`
        );
        children($$renderer2);
        $$renderer2.push(`<!----></a>`);
      } else {
        $$renderer2.push('<!--[!-->');
        children($$renderer2);
        $$renderer2.push(`<!---->`);
      }
      $$renderer2.push(`<!--]--> `);
      if (dismissable) {
        $$renderer2.push('<!--[-->');
        if (icon) {
          $$renderer2.push('<!--[-->');
          CloseButton($$renderer2, {
            class: 'ms-1.5 -me-1.5',
            color,
            size: large ? 'sm' : 'xs',
            ariaLabel: 'Remove badge',
            children: ($$renderer3) => {
              icon($$renderer3);
              $$renderer3.push(`<!---->`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer2.push('<!--[!-->');
          CloseButton($$renderer2, {
            class: 'ms-1.5 -me-1.5',
            color,
            size: large ? 'sm' : 'xs',
            ariaLabel: 'Remove badge'
          });
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { badgeStatus });
  });
}
tv({
  slots: {
    base: 'fixed z-50 flex justify-between p-4 mx-auto dark:bg-gray-700 dark:border-gray-600',
    insideDiv: 'flex flex-col md:flex-row md:items-center gap-2 mx-auto',
    dismissable: 'absolute end-2.5 top-2.5 md:static md:end-auto md:top-auto'
  },
  variants: {
    type: {
      top: {
        base: 'top-0 start-0 w-full border-b border-gray-200 bg-gray-50'
      },
      bottom: {
        base: 'bottom-0 start-0 w-full border-t border-gray-200 bg-gray-50'
      }
    },
    color: {
      // 'primary' secondary, | 'gray' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'
      primary: { base: 'bg-primary-50 dark:bg-primary-900' },
      secondary: { base: 'bg-secondary-50 dark:bg-secondary-900' },
      gray: { base: 'bg-gray-50 dark:bg-gray-700' },
      red: { base: 'bg-red-50 dark:bg-red-900' },
      orange: { base: 'bg-orange-50 dark:bg-orange-900' },
      amber: { base: 'bg-amber-50 dark:bg-amber-900' },
      yellow: { base: 'bg-yellow-50 dark:bg-yellow-900' },
      lime: { base: 'bg-lime-50 dark:bg-lime-900' },
      green: { base: 'bg-green-50 dark:bg-green-900' },
      emerald: { base: 'bg-emerald-50 dark:bg-emerald-900' },
      teal: { base: 'bg-teal-50 dark:bg-teal-900' },
      cyan: { base: 'bg-cyan-50 dark:bg-cyan-900' },
      sky: { base: 'bg-sky-50 dark:bg-sky-900' },
      blue: { base: 'bg-blue-50 dark:bg-blue-900' },
      indigo: { base: 'bg-indigo-50 dark:bg-indigo-900' },
      violet: { base: 'bg-violet-50 dark:bg-violet-900' },
      purple: { base: 'bg-purple-50 dark:bg-purple-900' },
      fuchsia: { base: 'bg-fuchsia-50 dark:bg-fuchsia-900' },
      pink: { base: 'bg-pink-50 dark:bg-pink-900' },
      rose: { base: 'bg-rose-50 dark:bg-rose-900' }
    }
  },
  defaultVariants: {
    type: 'top',
    multiline: true
  }
});
tv({
  slots: {
    base: 'w-full z-30 border-gray-200 dark:bg-gray-700 dark:border-gray-600',
    inner: 'grid h-full max-w-lg mx-auto'
  },
  variants: {
    position: {
      static: { base: 'static' },
      fixed: { base: 'fixed' },
      absolute: { base: 'absolute' },
      relative: { base: 'relative' },
      sticky: { base: 'sticky' }
    },
    navType: {
      default: { base: 'bottom-0 start-0 h-16 bg-white border-t' },
      border: { base: 'bottom-0 start-0 h-16 bg-white border-t' },
      application: {
        base: 'h-16 max-w-lg -translate-x-1/2 rtl:translate-x-1/2 bg-white border rounded-full bottom-4 start-1/2'
      },
      pagination: {
        base: 'bottom-0 h-16 -translate-x-1/2 rtl:translate-x-1/2 bg-white border-t start-1/2'
      },
      group: {
        base: 'bottom-0 -translate-x-1/2 rtl:translate-x-1/2 bg-white border-t start-1/2'
      },
      card: { base: 'bottom-0 start-0 h-16 bg-white border-t' },
      meeting: {
        base: 'bottom-0 start-0 grid h-16 grid-cols-1 px-8 bg-white border-t md:grid-cols-3',
        inner: 'flex items-center justify-center mx-auto'
      },
      video: {
        base: 'bottom-0 start-0 grid h-24 grid-cols-1 px-8 bg-white border-t md:grid-cols-3',
        inner: 'flex items-center w-full'
      }
    }
  },
  defaultVariants: {
    position: 'fixed',
    navType: 'default'
  }
});
tv({
  slots: {
    base: 'inline-flex flex-col items-center justify-center',
    span: 'text-sm'
  },
  variants: {
    navType: {
      default: {
        base: 'px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
        span: 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500'
      },
      border: {
        base: 'px-5 border-gray-200 border-x hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600',
        span: 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500'
      },
      application: {
        base: '',
        span: 'sr-only'
      },
      pagination: {
        base: 'px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
        span: 'sr-only'
      },
      group: {
        base: 'p-4 hover:bg-gray-50 dark:hover:bg-gray-800 group',
        span: 'sr-only'
      },
      card: {
        base: 'px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group',
        span: 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500'
      },
      meeting: {
        base: '',
        span: ''
      },
      video: {
        base: '',
        span: ''
      }
    },
    appBtnPosition: {
      left: {
        base: 'px-5 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group'
      },
      middle: { base: 'px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group' },
      right: {
        base: 'px-5 rounded-e-full hover:bg-gray-50 dark:hover:bg-gray-800 group'
      }
    }
  },
  defaultVariants: {
    navType: 'default',
    appBtnPosition: 'middle',
    active: false
  }
});
tv({
  slots: {
    base: 'w-full',
    innerDiv:
      'grid max-w-xs grid-cols-3 gap-1 p-1 mx-auto my-2 bg-gray-100 rounded-lg dark:bg-gray-600'
  }
});
tv({
  base: 'px-5 py-1.5 text-xs font-medium rounded-lg',
  variants: {
    active: {
      true: 'text-white bg-gray-900 dark:bg-gray-300 dark:text-gray-900',
      false: 'text-gray-900 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700'
    }
  }
});
tv({
  slots: {
    base: 'flex',
    list: 'inline-flex items-center space-x-1 rtl:space-x-reverse md:space-x-3 rtl:space-x-reverse'
  },
  variants: {
    solid: {
      true: {
        base: 'px-5 py-3 text-gray-700 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
      },
      false: ''
    }
  },
  defaultVariants: {
    solid: false
  }
});
tv({
  slots: {
    base: 'inline-flex items-center',
    separator: 'h-6 w-6 text-gray-400 rtl:-scale-x-100'
  },
  variants: {
    home: {
      true: '',
      false: ''
    },
    hasHref: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [
    {
      home: true,
      class: {
        base: 'inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
        separator: 'me-2 h-4 w-4'
      }
    },
    {
      home: false,
      hasHref: true,
      class: {
        base: 'ms-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ms-2 dark:text-gray-400 dark:hover:text-white'
      }
    },
    {
      home: false,
      hasHref: false,
      class: {
        base: 'ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400'
      }
    }
  ]
});
tv({
  base: 'inline-flex rounded-lg shadow-xs',
  variants: {
    size: {
      sm: '',
      md: '',
      lg: ''
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
const button = tv({
  slots: {
    base: 'text-center font-medium inline-flex items-center justify-center',
    outline: 'bg-transparent border hover:text-white dark:bg-transparent dark:hover-text-white',
    shadow: 'shadow-lg',
    spinner: 'ms-2'
  },
  variants: {
    color: {
      // "primary" | "dark" | "alternative" | "light" | "secondary" | "gray" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose"
      primary: {
        base: 'text-white bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 focus-within:ring-primary-300 dark:focus-within:ring-primary-800',
        outline:
          'text-primary-700 border-primary-700 hover:bg-primary-800 dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600',
        shadow: 'shadow-primary-500/50 dark:shadow-primary-800/80'
      },
      dark: {
        base: 'text-white bg-gray-800 hover:bg-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 focus-within:ring-gray-300 dark:focus-within:ring-gray-700',
        outline:
          'text-gray-900 border-gray-800 hover:bg-gray-900 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600',
        shadow: 'shadow-gray-500/50 gray:shadow-gray-800/80'
      },
      alternative: {
        base: 'text-gray-900 bg-transparent border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 hover:text-primary-700 focus-within:text-primary-700 dark:focus-within:text-white dark:hover:text-white dark:hover:bg-gray-700 focus-within:ring-gray-200 dark:focus-within:ring-gray-700',
        outline:
          'text-gray-700 border-gray-700 hover:bg-gray-800 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-500',
        shadow: '_shadow-gray-500/50 dark:shadow-gray-800/80'
      },
      light: {
        base: 'text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 focus-within:ring-gray-200 dark:focus-within:ring-gray-700',
        outline:
          'text-gray-700 border-gray-700 hover:bg-gray-800 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-500',
        shadow: 'shadow-gray-500/50 dark:shadow-gray-800/80'
      },
      secondary: {
        base: 'text-white bg-secondary-700 hover:bg-secondary-800 dark:bg-secondary-600 dark:hover:bg-secondary-700 focus-within:ring-secondary-300 dark:focus-within:ring-secondary-800',
        outline:
          'text-secondary-700 border-secondary-700 hover:bg-secondary-800 dark:border-secondary-400 dark:text-secondary-400 dark:hover:bg-secondary-500',
        shadow: 'shadow-secondary-500/50 dark:shadow-secondary-800/80'
      },
      gray: {
        base: 'text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 focus-within:ring-gray-300 dark:focus-within:ring-gray-800',
        outline:
          'text-gray-700 border-gray-700 hover:bg-gray-800 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-500',
        shadow: 'shadow-gray-500/50 dark:shadow-gray-800/80'
      },
      red: {
        base: 'text-white bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 focus-within:ring-red-300 dark:focus-within:ring-red-900',
        outline:
          'text-red-700 border-red-700 hover:bg-red-800 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600',
        shadow: 'shadow-red-500/50 dark:shadow-red-800/80'
      },
      orange: {
        base: 'text-white bg-orange-700 hover:bg-orange-800 dark:bg-orange-600 dark:hover:bg-orange-700 focus-within:ring-orange-300 dark:focus-within:ring-orange-900',
        outline:
          'text-orange-700 border-orange-700 hover:bg-orange-800 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-500',
        shadow: 'shadow-orange-500/50 dark:shadow-orange-800/80'
      },
      amber: {
        base: 'text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 focus-within:ring-amber-300 dark:focus-within:ring-amber-900',
        outline:
          'text-amber-700 border-amber-700 hover:bg-amber-800 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-500',
        shadow: 'shadow-amber-500/50 dark:shadow-amber-800/80'
      },
      yellow: {
        base: 'text-white bg-yellow-400 hover:bg-yellow-500 focus-within:ring-yellow-300 dark:focus-within:ring-yellow-900',
        outline:
          'text-yellow-400 border-yellow-400 hover:bg-yellow-500 dark:border-yellow-300 dark:text-yellow-300 dark:hover:bg-yellow-400',
        shadow: 'shadow-yellow-500/50 dark:shadow-yellow-800/80'
      },
      lime: {
        base: 'text-white bg-lime-700 hover:bg-lime-800 dark:bg-lime-600 dark:hover:bg-lime-700 focus-within:ring-lime-300 dark:focus-within:ring-lime-800',
        outline:
          'text-lime-700 border-lime-700 hover:bg-lime-800 dark:border-lime-400 dark:text-lime-400 dark:hover:bg-lime-500',
        shadow: 'shadow-lime-500/50 dark:shadow-lime-800/80'
      },
      green: {
        base: 'text-white bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 focus-within:ring-green-300 dark:focus-within:ring-green-800',
        outline:
          'text-green-700 border-green-700 hover:bg-green-800 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600',
        shadow: 'shadow-green-500/50 dark:shadow-green-800/80'
      },
      emerald: {
        base: 'text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus-within:ring-emerald-300 dark:focus-within:ring-emerald-800',
        outline:
          'text-emerald-700 border-emerald-700 hover:bg-emerald-800 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-500',
        shadow: 'shadow-emerald-500/50 dark:shadow-emerald-800/80'
      },
      teal: {
        base: 'text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 focus-within:ring-teal-300 dark:focus-within:ring-teal-800',
        outline:
          'text-teal-700 border-teal-700 hover:bg-teal-800 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-500',
        shadow: 'shadow-teal-500/50 dark:shadow-teal-800/80'
      },
      cyan: {
        base: 'text-white bg-cyan-700 hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 focus-within:ring-cyan-300 dark:focus-within:ring-cyan-800',
        outline:
          'text-cyan-700 border-cyan-700 hover:bg-cyan-800 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-cyan-500',
        shadow: 'shadow-cyan-500/50 dark:shadow-cyan-800/80'
      },
      sky: {
        base: 'text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-700 focus-within:ring-sky-300 dark:focus-within:ring-sky-800',
        outline:
          'text-sky-700 border-sky-700 hover:bg-sky-800 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-500',
        shadow: 'shadow-sky-500/50 dark:shadow-sky-800/80'
      },
      blue: {
        base: 'text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 focus-within:ring-blue-300 dark:focus-within:ring-blue-800',
        outline:
          'text-blue-700 border-blue-700 hover:bg-blue-800 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-500',
        shadow: 'shadow-blue-500/50 dark:shadow-blue-800/80'
      },
      indigo: {
        base: 'text-white bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus-within:ring-indigo-300 dark:focus-within:ring-indigo-800',
        outline:
          'text-indigo-700 border-indigo-700 hover:bg-indigo-800 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-500',
        shadow: 'shadow-indigo-500/50 dark:shadow-indigo-800/80'
      },
      violet: {
        base: 'text-white bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 focus-within:ring-violet-300 dark:focus-within:ring-violet-800',
        outline:
          'text-violet-700 border-violet-700 hover:bg-violet-800 dark:border-violet-400 dark:text-violet-400 dark:hover:bg-violet-500',
        shadow: 'shadow-violet-500/50 dark:shadow-violet-800/80'
      },
      purple: {
        base: 'text-white bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700',
        outline:
          'text-purple-700 border-purple-700 hover:bg-purple-800 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-500',
        shadow: 'shadow-purple-500/50 dark:shadow-purple-800/80'
      },
      fuchsia: {
        base: 'text-white bg-fuchsia-700 hover:bg-fuchsia-800 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-700',
        outline:
          'text-fuchsia-700 border-fuchsia-700 hover:bg-fuchsia-800 dark:border-fuchsia-400 dark:text-fuchsia-400 dark:hover:bg-fuchsia-500',
        shadow: 'shadow-fuchsia-500/50 dark:shadow-fuchsia-800/80'
      },
      pink: {
        base: 'text-white bg-pink-700 hover:bg-pink-800 dark:bg-pink-600 dark:hover:bg-pink-700',
        outline:
          'text-pink-700 border-pink-700 hover:bg-pink-800 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-500',
        shadow: 'shadow-pink-500/50 dark:shadow-pink-800/80'
      },
      rose: {
        base: 'text-white bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700',
        outline:
          'text-rose-700 border-rose-700 hover:bg-rose-800 dark:border-rose-400 dark:text-rose-400 dark:hover:bg-rose-500',
        shadow: 'shadow-rose-500/50 dark:shadow-rose-800/80'
      }
    },
    size: {
      xs: 'px-3 py-2 text-xs',
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
      xl: 'px-6 py-3.5 text-base'
    },
    group: {
      true: 'focus-within:ring-2 focus-within:z-10 [&:not(:first-child)]:rounded-s-none [&:not(:last-child)]:rounded-e-none [&:not(:last-child)]:border-e-0',
      false: 'focus-within:ring-4 focus-within:outline-hidden'
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
      false: ''
    },
    pill: {
      true: 'rounded-full',
      false: 'rounded-lg'
    },
    checked: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [],
  defaultVariants: {
    pill: false
  }
});
tv({
  slots: {
    base: 'inline-flex items-center justify-center transition-all duration-75 ease-in text-white bg-linear-to-r ',
    outlineWrapper: 'inline-flex items-center justify-center w-full border-0!'
  },
  variants: {
    color: {
      blue: {
        base: 'from-blue-500 via-blue-600 to-blue-700 hover:bg-linear-to-br focus:ring-blue-300 dark:focus:ring-blue-800'
      },
      green: {
        base: 'from-green-400 via-green-500 to-green-600 hover:bg-linear-to-br focus:ring-green-300 dark:focus:ring-green-800'
      },
      cyan: {
        base: 'text-white bg-linear-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-linear-to-br focus:ring-cyan-300 dark:focus:ring-cyan-800'
      },
      teal: {
        base: 'text-white bg-linear-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-linear-to-br focus:ring-teal-300 dark:focus:ring-teal-800'
      },
      lime: {
        base: 'text-gray-900 bg-linear-to-r from-lime-200 via-lime-400 to-lime-500 hover:bg-linear-to-br focus:ring-lime-300 dark:focus:ring-lime-800'
      },
      red: {
        base: 'text-white bg-linear-to-r from-red-400 via-red-500 to-red-600 hover:bg-linear-to-br focus:ring-red-300 dark:focus:ring-red-800'
      },
      pink: {
        base: 'text-white bg-linear-to-r from-pink-400 via-pink-500 to-pink-600 hover:bg-linear-to-br focus:ring-pink-300 dark:focus:ring-pink-800'
      },
      purple: {
        base: 'text-white bg-linear-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-linear-to-br focus:ring-purple-300 dark:focus:ring-purple-800'
      },
      purpleToBlue: {
        base: 'text-white bg-linear-to-br from-purple-600 to-blue-500 hover:bg-linear-to-bl focus:ring-blue-300 dark:focus:ring-blue-800'
      },
      cyanToBlue: {
        base: 'text-white bg-linear-to-r from-cyan-500 to-blue-500 hover:bg-linear-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800'
      },
      greenToBlue: {
        base: 'text-white bg-linear-to-br from-green-400 to-blue-600 hover:bg-linear-to-bl focus:ring-green-200 dark:focus:ring-green-800'
      },
      purpleToPink: {
        base: 'text-white bg-linear-to-r from-purple-500 to-pink-500 hover:bg-linear-to-l focus:ring-purple-200 dark:focus:ring-purple-800'
      },
      pinkToOrange: {
        base: 'text-white bg-linear-to-br from-pink-500 to-orange-400 hover:bg-linear-to-bl focus:ring-pink-200 dark:focus:ring-pink-800'
      },
      tealToLime: {
        base: 'text-gray-900 bg-linear-to-r from-teal-200 to-lime-200 hover:bg-linear-to-l focus:ring-lime-200 dark:focus:ring-teal-700'
      },
      redToYellow: {
        base: 'text-gray-900 bg-linear-to-r from-red-200 via-red-300 to-yellow-200 hover:bg-linear-to-bl focus:ring-red-100 dark:focus:ring-red-400'
      }
    },
    outline: {
      true: {
        base: 'p-0.5',
        outlineWrapper:
          'bg-white text-gray-900! dark:bg-gray-900 dark:text-white! hover:bg-transparent hover:text-inherit! group-hover:opacity-0! group-hover:text-inherit!'
      }
    },
    pill: {
      true: {
        base: 'rounded-full',
        outlineWrapper: 'rounded-full'
      },
      false: {
        base: 'rounded-lg',
        outlineWrapper: 'rounded-lg'
      }
    },
    size: {
      xs: 'px-3 py-2 text-xs',
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
      xl: 'px-6 py-3.5 text-base'
    },
    shadow: {
      true: {
        base: 'shadow-lg'
      }
    },
    group: {
      true: 'rounded-none',
      false: ''
    },
    disabled: {
      true: { base: 'opacity-50 cursor-not-allowed' }
    }
  },
  compoundVariants: [
    {
      shadow: true,
      color: 'blue',
      class: { base: 'shadow-blue-500/50 dark:shadow-blue-800/80' }
    },
    {
      shadow: true,
      color: 'green',
      class: { base: 'shadow-green-500/50 dark:shadow-green-800/80' }
    },
    {
      shadow: true,
      color: 'cyan',
      class: { base: 'shadow-cyan-500/50 dark:shadow-cyan-800/80' }
    },
    {
      shadow: true,
      color: 'teal',
      class: { base: 'shadow-teal-500/50 dark:shadow-teal-800/80' }
    },
    {
      shadow: true,
      color: 'lime',
      class: { base: 'shadow-lime-500/50 dark:shadow-lime-800/80' }
    },
    {
      shadow: true,
      color: 'red',
      class: { base: 'shadow-red-500/50 dark:shadow-red-800/80' }
    },
    {
      shadow: true,
      color: 'pink',
      class: { base: 'shadow-pink-500/50 dark:shadow-pink-800/80' }
    },
    {
      shadow: true,
      color: 'purple',
      class: { base: 'shadow-purple-500/50 dark:shadow-purple-800/80' }
    },
    {
      shadow: true,
      color: 'purpleToBlue',
      class: { base: 'shadow-blue-500/50 dark:shadow-blue-800/80' }
    },
    {
      shadow: true,
      color: 'cyanToBlue',
      class: { base: 'shadow-cyan-500/50 dark:shadow-cyan-800/80' }
    },
    {
      shadow: true,
      color: 'greenToBlue',
      class: { base: 'shadow-green-500/50 dark:shadow-green-800/80' }
    },
    {
      shadow: true,
      color: 'purpleToPink',
      class: { base: 'shadow-purple-500/50 dark:shadow-purple-800/80' }
    },
    {
      shadow: true,
      color: 'pinkToOrange',
      class: { base: 'shadow-pink-500/50 dark:shadow-pink-800/80' }
    },
    {
      shadow: true,
      color: 'tealToLime',
      class: { base: 'shadow-lime-500/50 dark:shadow-teal-800/80' }
    },
    {
      shadow: true,
      color: 'redToYellow',
      class: { base: 'shadow-red-500/50 dark:shadow-red-800/80' }
    },
    {
      group: true,
      pill: true,
      class: 'first:rounded-s-full last:rounded-e-full'
    },
    {
      group: true,
      pill: false,
      class: 'first:rounded-s-lg last:rounded-e-lg'
    }
  ]
});
function Button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const group = getContext('group');
    const ctxDisabled = getContext('disabled');
    let {
      children,
      pill,
      outline = false,
      size = 'md',
      color,
      shadow = false,
      tag = 'button',
      disabled,
      loading = false,
      spinnerProps = { size: '4' },
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const theme = getTheme('button');
    let actualSize = group ? 'sm' : size;
    let actualColor = color ?? (group ? (outline ? 'dark' : 'alternative') : 'primary');
    let isDisabled = Boolean(ctxDisabled) || Boolean(disabled) || loading;
    const {
      base,
      outline: outline_,
      shadow: shadow_,
      spinner: spinner2
    } = button({
      color: actualColor,
      size: actualSize,
      disabled: isDisabled,
      pill,
      group: !!group
    });
    let btnCls = base({
      class: clsx(outline && outline_(), shadow && shadow_(), theme?.base, className)
    });
    if (restProps.href !== void 0) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<a${attributes({ ...restProps, class: clsx$1(btnCls) })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></a>`);
    } else {
      $$renderer2.push('<!--[!-->');
      if (tag === 'button') {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<button${attributes({
            type: 'button',
            ...restProps,
            class: clsx$1(btnCls),
            disabled: isDisabled
          })}>`
        );
        children?.($$renderer2);
        $$renderer2.push(`<!----> `);
        if (loading) {
          $$renderer2.push('<!--[-->');
          Spinner($$renderer2, spread_props([spinnerProps, { class: spinner2() }]));
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--></button>`);
      } else {
        $$renderer2.push('<!--[!-->');
        element(
          $$renderer2,
          tag,
          () => {
            $$renderer2.push(`${attributes({ ...restProps, class: clsx$1(btnCls) })}`);
          },
          () => {
            children?.($$renderer2);
            $$renderer2.push(`<!---->`);
          }
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
tv({
  slots: {
    base: 'w-full flex max-w-sm bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700',
    image: 'rounded-t-lg'
  },
  variants: {
    size: {
      xs: { base: 'max-w-xs' },
      sm: { base: 'max-w-sm' },
      md: { base: 'max-w-lg' },
      lg: { base: 'max-w-2xl' },
      xl: { base: 'max-w-none' }
    },
    color: {
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      gray: { base: 'border-gray-200 dark:bg-gray-800 dark:border-gray-700' },
      primary: {
        base: 'border-primary-200 bg-primary-400 dark:bg-primary-800 dark:border-primary-700'
      },
      secondary: {
        base: 'border-secondary-200 bg-secondary-400 dark:bg-secondary-800 dark:border-secondary-700'
      },
      red: { base: 'border-red-200 bg-red-400 dark:bg-red-800 dark:border-red-700' },
      orange: { base: 'border-orange-200 bg-orange-400 dark:bg-orange-800 dark:border-orange-700' },
      amber: { base: 'border-amber-200 bg-amber-400 dark:bg-amber-800 dark:border-amber-700' },
      yellow: { base: 'border-yellow-200 bg-yellow-400 dark:bg-yellow-800 dark:border-yellow-700' },
      lime: { base: 'border-lime-200 bg-lime-400 dark:bg-lime-800 dark:border-lime-700' },
      green: { base: 'border-green-200 bg-green-400 dark:bg-green-800 dark:border-green-700' },
      emerald: {
        base: 'border-emerald-200 bg-emerald-400 dark:bg-emerald-800 dark:border-emerald-700'
      },
      teal: { base: 'border-teal-200 bg-teal-400 dark:bg-teal-800 dark:border-teal-700' },
      cyan: { base: 'border-cyan-200 bg-cyan-400 dark:bg-cyan-800 dark:border-cyan-700' },
      sky: { base: 'border-sky-200 bg-sky-400 dark:bg-sky-800 dark:border-sky-700' },
      blue: { base: 'border-blue-200 bg-blue-400 dark:bg-blue-800 dark:border-blue-700' },
      indigo: { base: 'border-indigo-200 bg-indigo-400 dark:bg-indigo-800 dark:border-indigo-700' },
      violet: { base: 'border-violet-200 bg-violet-400 dark:bg-violet-800 dark:border-violet-700' },
      purple: { base: 'border-purple-200 bg-purple-400 dark:bg-purple-800 dark:border-purple-700' },
      fuchsia: {
        base: 'border-fuchsia-200 bg-fuchsia-400 dark:bg-fuchsia-800 dark:border-fuchsia-700'
      },
      pink: { base: 'border-pink-200 bg-pink-400 dark:bg-pink-800 dark:border-pink-700' },
      rose: { base: 'border-rose-200 bg-rose-400 dark:bg-rose-800 dark:border-rose-700' }
    },
    shadow: {
      xs: { base: 'shadow-xs' },
      sm: { base: 'shadow-sm' },
      normal: { base: 'shadow' },
      md: { base: 'shadow-md' },
      lg: { base: 'shadow-lg' },
      xl: { base: 'shadow-xl' },
      '2xl': { base: 'shadow-2xl' },
      inner: { base: 'shadow-inner' }
    },
    horizontal: {
      true: {
        base: 'md:flex-row',
        image: 'object-cover w-full h-96 md:h-auto md:w-48 md:rounded-none'
      }
    },
    reverse: {
      true: { base: 'flex-col-reverse', image: 'rounded-b-lg rounded-tl-none' },
      false: { base: 'flex-col', image: 'rounded-t-lg' }
    },
    href: {
      true: '',
      false: ''
    },
    hasImage: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [
    {
      horizontal: true,
      reverse: true,
      class: { base: 'md:flex-row-reverse', image: 'md:rounded-e-lg' }
    },
    {
      horizontal: true,
      reverse: false,
      class: { base: 'md:flex-row', image: 'md:rounded-s-lg' }
    },
    // gray, primary, secondary, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
    {
      href: true,
      color: 'gray',
      class: { base: 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' }
    },
    {
      href: true,
      color: 'primary',
      class: { base: 'cursor-pointer hover:bg-primary-500 dark:hover:bg-primary-700' }
    },
    {
      href: true,
      color: 'secondary',
      class: { base: 'cursor-pointer hover:bg-secondary-500 dark:hover:bg-secondary-700' }
    },
    {
      href: true,
      color: 'red',
      class: { base: 'cursor-pointer hover:bg-red-500 dark:hover:bg-red-700' }
    },
    {
      href: true,
      color: 'orange',
      class: { base: 'cursor-pointer hover:bg-orange-500 dark:hover:bg-orange-700' }
    },
    {
      href: true,
      color: 'amber',
      class: { base: 'cursor-pointer hover:bg-amber-500 dark:hover:bg-amber-700' }
    },
    {
      href: true,
      color: 'yellow',
      class: { base: 'cursor-pointer hover:bg-yellow-500 dark:hover:bg-yellow-700' }
    },
    {
      href: true,
      color: 'lime',
      class: { base: 'cursor-pointer hover:bg-lime-500 dark:hover:bg-lime-700' }
    },
    {
      href: true,
      color: 'green',
      class: { base: 'cursor-pointer hover:bg-green-500 dark:hover:bg-green-700' }
    },
    {
      href: true,
      color: 'emerald',
      class: { base: 'cursor-pointer hover:bg-emerald-500 dark:hover:bg-emerald-700' }
    },
    {
      href: true,
      color: 'teal',
      class: { base: 'cursor-pointer hover:bg-teal-500 dark:hover:bg-teal-700' }
    },
    {
      href: true,
      color: 'cyan',
      class: { base: 'cursor-pointer hover:bg-cyan-500 dark:hover:bg-cyan-700' }
    },
    {
      href: true,
      color: 'sky',
      class: { base: 'cursor-pointer hover:bg-sky-500 dark:hover:bg-sky-700' }
    },
    {
      href: true,
      color: 'blue',
      class: { base: 'cursor-pointer hover:bg-blue-500 dark:hover:bg-blue-700' }
    },
    {
      href: true,
      color: 'indigo',
      class: { base: 'cursor-pointer hover:bg-indigo-500 dark:hover:bg-indigo-700' }
    },
    {
      href: true,
      color: 'violet',
      class: { base: 'cursor-pointer hover:bg-violet-500 dark:hover:bg-violet-700' }
    },
    {
      href: true,
      color: 'purple',
      class: { base: 'cursor-pointer hover:bg-purple-500 dark:hover:bg-purple-700' }
    },
    {
      href: true,
      color: 'fuchsia',
      class: { base: 'cursor-pointer hover:bg-fuchsia-500 dark:hover:bg-fuchsia-700' }
    },
    {
      href: true,
      color: 'pink',
      class: { base: 'cursor-pointer hover:bg-pink-500 dark:hover:bg-pink-700' }
    },
    {
      href: true,
      color: 'rose',
      class: { base: 'cursor-pointer hover:bg-rose-500 dark:hover:bg-rose-700' }
    }
  ],
  defaultVariants: {
    size: 'sm',
    shadow: 'normal',
    horizontal: false,
    reverse: false
  }
});
tv({
  slots: {
    base: 'grid overflow-hidden relative rounded-lg h-56 sm:h-64 xl:h-80 2xl:h-96',
    slide: ''
  },
  variants: {},
  compoundVariants: [],
  defaultVariants: {}
});
tv({
  slots: {
    base: 'absolute start-1/2 z-30 flex -translate-x-1/2 space-x-3 rtl:translate-x-1/2 rtl:space-x-reverse',
    indicator: 'bg-gray-100 hover:bg-gray-300'
  },
  variants: {
    selected: {
      true: { indicator: 'opacity-100' },
      false: { indicator: 'opacity-60' }
    },
    position: {
      top: { base: 'top-5' },
      bottom: { base: 'bottom-5' }
    }
  }
});
tv({
  slots: {
    base: 'flex absolute top-0 z-30 justify-center items-center px-4 h-full group focus:outline-hidden text-white dark:text-gray-300',
    span: 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/30 group-hover:bg-white/50 group-focus:ring-4 group-focus:ring-white group-focus:outline-hidden sm:h-10 sm:w-10 dark:bg-gray-800/30 dark:group-hover:bg-gray-800/60 dark:group-focus:ring-gray-800/70'
  },
  variants: {
    forward: {
      true: 'end-0',
      false: 'start-0'
    }
  }
});
tv({
  base: 'flex flex-row justify-center bg-gray-100 w-full'
});
tv({
  base: '',
  variants: {
    selected: {
      true: 'opacity-100',
      false: 'opacity-60'
    }
  },
  defaultVariants: {
    selected: false
  }
});
tv({
  base: 'absolute block w-full h-full',
  variants: {
    fit: {
      contain: 'object-contain',
      cover: 'object-cover',
      fill: 'object-fill',
      none: 'object-none',
      'scale-down': 'object-scale-down'
    }
  },
  defaultVariants: {
    fit: 'cover'
  }
});
tv({
  base: 'gap-2',
  variants: {
    embedded: {
      true: 'px-1 py-1 focus-within:ring-0 bg-transparent hover:bg-transparent text-inherit',
      false: ''
    }
  },
  defaultVariants: {
    embedded: false
  }
});
tv({
  base: 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-hidden rounded-lg text-sm p-2.5'
});
tv({
  slots: {
    base: 'flex justify-between items-center',
    content: 'flex flex-wrap items-center'
  },
  variants: {
    embedded: {
      true: {},
      false: {
        base: 'py-2 px-3 rounded-lg dark:border'
      }
    },
    color: {
      default: {
        base: 'bg-gray-50 dark:bg-gray-800 dark:border-gray-600',
        content: 'divide-gray-300 dark:divide-gray-800'
      },
      primary: {
        base: 'bg-primary-50 dark:bg-gray-800 dark:border-primary-800',
        content: 'divide-primary-300 dark:divide-primary-800'
      },
      secondary: {
        base: 'bg-secondary-50 dark:bg-gray-800 dark:border-secondary-800',
        content: 'divide-secondary-300 dark:divide-primary-800'
      },
      gray: {
        base: 'bg-gray-50 dark:bg-gray-800 dark:border-gray-800',
        content: 'divide-gray-300 dark:divide-gray-800'
      },
      red: {
        base: 'bg-red-50 dark:bg-gray-800 dark:border-red-800',
        content: 'divide-red-300 dark:divide-red-800'
      },
      yellow: {
        base: 'bg-yellow-50 dark:bg-gray-800 dark:border-yellow-800',
        content: 'divide-yellow-300 dark:divide-yellow-800'
      },
      green: {
        base: 'bg-green-50 dark:bg-gray-800 dark:border-green-800',
        content: 'divide-green-300 dark:divide-green-800'
      },
      indigo: {
        base: 'bg-indigo-50 dark:bg-gray-800 dark:border-indigo-800',
        content: 'divide-indigo-300 dark:divide-indigo-800'
      },
      purple: {
        base: 'bg-purple-50 dark:bg-gray-800 dark:border-purple-800',
        content: 'divide-purple-300 dark:divide-purple-800'
      },
      pink: {
        base: 'bg-pink-50 dark:bg-gray-800 dark:border-pink-800',
        content: 'divide-pink-300 dark:divide-pink-800'
      },
      blue: {
        base: 'bg-blue-50 dark:bg-gray-800 dark:border-blue-800',
        content: 'divide-blue-300 dark:divide-blue-800'
      },
      dark: {
        base: 'bg-gray-50 dark:bg-gray-800 dark:border-gray-800',
        content: 'divide-gray-300 dark:divide-gray-800'
      }
    },
    separators: {
      true: {
        content: 'sm:divide-x rtl:divide-x-reverse'
      }
    }
  },
  compoundVariants: [
    {
      embedded: true,
      color: 'default',
      class: {
        base: 'bg-transparent'
      }
    }
  ],
  defaultVariants: {
    color: 'default'
  }
});
tv({
  base: 'flex items-center',
  variants: {
    spacing: {
      default: 'space-x-1 rtl:space-x-reverse',
      tight: 'space-x-0.5 rtl:space-x-reverse',
      loose: 'space-x-2 rtl:space-x-reverse'
    },
    padding: {
      default: 'sm:not(:last):pe-4 sm:not(:first):ps-4',
      none: ''
    },
    position: {
      middle: '',
      first: 'sm:ps-0',
      last: 'sm:pe-0'
    }
  },
  compoundVariants: [
    {
      position: ['first', 'last'],
      class: 'sm:px-0'
    }
  ],
  defaultVariants: {
    spacing: 'default',
    padding: 'default'
  }
});
tv({
  base: 'focus:outline-hidden whitespace-normal',
  variants: {
    color: {
      dark: 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600',
      gray: 'text-gray-500 focus:ring-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-300',
      red: 'text-red-500 focus:ring-red-400 hover:bg-red-200 dark:hover:bg-red-800 dark:hover:text-red-300',
      yellow:
        'text-yellow-500 focus:ring-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800 dark:hover:text-yellow-300',
      green:
        'text-green-500 focus:ring-green-400 hover:bg-green-200 dark:hover:bg-green-800 dark:hover:text-green-300',
      indigo:
        'text-indigo-500 focus:ring-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 dark:hover:text-indigo-300',
      purple:
        'text-purple-500 focus:ring-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 dark:hover:text-purple-300',
      pink: 'text-pink-500 focus:ring-pink-400 hover:bg-pink-200 dark:hover:bg-pink-800 dark:hover:text-pink-300',
      blue: 'text-blue-500 focus:ring-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 dark:hover:text-blue-300',
      primary:
        'text-primary-500 focus:ring-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800 dark:hover:text-primary-300',
      default: 'focus:ring-gray-400 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50'
    },
    size: {
      xs: 'm-0.5 rounded-xs focus:ring-1 p-0.5',
      sm: 'm-0.5 rounded-sm focus:ring-1 p-0.5',
      md: 'm-0.5 rounded-lg focus:ring-2 p-1.5',
      lg: 'm-0.5 rounded-lg focus:ring-2 p-2.5'
    },
    background: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [
    {
      color: 'default',
      background: true,
      class: 'dark:hover:bg-gray-600'
    },
    {
      color: 'default',
      background: false,
      class: 'dark:hover:bg-gray-700'
    }
  ],
  defaultVariants: {
    color: 'default',
    size: 'md'
  }
});
tv({
  slots: {
    base: 'inline-block rounded-lg bg-white dark:bg-gray-700 shadow-lg p-4',
    input:
      'w-full rounded-md border px-4 py-2 text-sm focus:ring-2 focus:outline-none outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900',
    titleVariant: 'mb-2 text-lg font-semibold text-gray-900 dark:text-white',
    polite:
      'text-sm rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 font-semibold py-2.5 px-5 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200',
    button:
      'absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 focus:outline-hidden dark:text-gray-400',
    actionButtons: 'mt-4 flex justify-between',
    columnHeader: 'text-center text-sm font-medium text-gray-500 dark:text-gray-400',
    grid: 'grid grid-cols-7 gap-1 w-64',
    nav: 'mb-4 flex items-center justify-between',
    dayButton:
      'h-8 w-full block flex-1 leading-9 border-0 rounded-lg cursor-pointer text-center font-semibold text-sm day p-0',
    monthButton:
      'rounded-lg px-3 py-2 text-sm hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700',
    actionSlot: ''
  },
  variants: {
    color: {
      primary: {
        input: 'focus:ring-primary-500 dark:focus:ring-primary-400',
        dayButton: 'bg-primary-300 dark:bg-primary-900'
      },
      blue: {
        input: 'focus:ring-blue-500 dark:focus:ring-blue-400',
        dayButton: 'bg-blue-300 dark:bg-blue-900'
      },
      red: {
        input: 'focus:ring-red-500 dark:focus:ring-red-400',
        dayButton: 'bg-red-300 dark:bg-red-900'
      },
      green: {
        input: 'focus:ring-green-500 dark:focus:ring-green-400',
        dayButton: 'bg-green-300 dark:bg-green-900'
      },
      yellow: {
        input: 'focus:ring-yellow-500 dark:focus:ring-yellow-400',
        dayButton: 'bg-yellow-300 dark:bg-yellow-900'
      },
      purple: {
        input: 'focus:ring-purple-500 dark:focus:ring-purple-400',
        dayButton: 'bg-purple-300 dark:bg-purple-900'
      },
      dark: {
        input: 'focus:ring-gray-500 dark:focus:ring-gray-400',
        dayButton: 'bg-gray-300 dark:bg-gray-900'
      },
      light: {
        input: 'focus:ring-gray-500 dark:focus:ring-gray-400',
        dayButton: 'bg-gray-300 dark:bg-gray-900'
      },
      alternative: {
        input: 'focus:ring-alternative-500 dark:focus:ring-alternative-400',
        dayButton: 'bg-alternative-300 dark:bg-alternative-900'
      },
      secondary: {
        input: 'focus:ring-secondary-500 dark:focus:ring-secondary-400',
        dayButton: 'bg-secondary-300 dark:bg-secondary-900'
      },
      gray: {
        input: 'focus:ring-gray-500 dark:focus:ring-gray-400',
        dayButton: 'bg-gray-300 dark:bg-gray-900'
      },
      orange: {
        input: 'focus:ring-orange-500 dark:focus:ring-orange-400',
        dayButton: 'bg-orange-300 dark:bg-orange-900'
      },
      amber: {
        input: 'focus:ring-amber-500 dark:focus:ring-amber-400',
        dayButton: 'bg-amber-300 dark:bg-amber-900'
      },
      lime: {
        input: 'focus:ring-lime-500 dark:focus:ring-lime-400',
        dayButton: 'bg-lime-300 dark:bg-lime-900'
      },
      emerald: {
        input: 'focus:ring-emerald-500 dark:focus:ring-emerald-400',
        dayButton: 'bg-emerald-300 dark:bg-emerald-900'
      },
      teal: {
        input: 'focus:ring-teal-500 dark:focus:ring-teal-400',
        dayButton: 'bg-teal-300 dark:bg-teal-900'
      },
      cyan: {
        input: 'focus:ring-cyan-500 dark:focus:ring-cyan-400',
        dayButton: 'bg-cyan-300 dark:bg-cyan-900'
      },
      sky: {
        input: 'focus:ring-sky-500 dark:focus:ring-sky-400',
        dayButton: 'bg-sky-300 dark:bg-sky-900'
      },
      indigo: {
        input: 'focus:ring-indigo-500 dark:focus:ring-indigo-400',
        dayButton: 'bg-indigo-300 dark:bg-indigo-900'
      },
      violet: {
        input: 'focus:ring-violet-500 dark:focus:ring-violet-400',
        dayButton: 'bg-violet-300 dark:bg-violet-900'
      },
      fuchsia: {
        input: 'focus:ring-fuchsia-500 dark:focus:ring-fuchsia-400',
        dayButton: 'bg-fuchsia-300 dark:bg-fuchsia-900'
      },
      pink: {
        input: 'focus:ring-pink-500 dark:focus:ring-pink-400',
        dayButton: 'bg-pink-300 dark:bg-pink-900'
      },
      rose: {
        input: 'focus:ring-rose-500 dark:focus:ring-rose-400',
        dayButton: 'bg-rose-300 dark:bg-rose-900'
      }
    },
    inline: {
      false: { base: 'absolute z-10 mt-1' }
    },
    current: {
      true: { dayButton: 'text-gray-400 dark:text-gray-500' }
    },
    today: {
      true: { dayButton: 'font-bold' }
    },
    unavailable: {
      true: { dayButton: 'opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700' }
    }
  },
  compoundVariants: []
});
tv({
  slots: {
    base: 'relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-xl h-[600px] w-[300px] shadow-xl',
    slot: 'rounded-xl overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800',
    top: 'w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute',
    leftTop: 'h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg',
    leftMid: 'h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg',
    leftBot: 'h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg',
    right: 'h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg'
  }
});
tv({
  slots: {
    base: 'relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px]',
    slot: 'rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800',
    top: 'h-[32px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg',
    leftTop:
      'h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg',
    leftBot:
      'h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg',
    right:
      'h-[64px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg'
  }
});
tv({
  slots: {
    base: 'relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[16px] rounded-t-xl h-[172px] max-w-[301px] md:h-[294px] md:max-w-[512px]',
    inner: 'rounded-xl overflow-hidden h-[140px] md:h-[262px]',
    bot: 'relative mx-auto bg-gray-900 dark:bg-gray-700 rounded-b-xl h-[24px] max-w-[301px] md:h-[42px] md:max-w-[512px]',
    botUnder:
      'relative mx-auto bg-gray-800 rounded-b-xl h-[55px] max-w-[83px] md:h-[95px] md:max-w-[142px]'
  }
});
tv({
  slots: {
    base: 'relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl',
    slot: 'rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800',
    top: 'w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute',
    leftTop: 'h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg',
    leftBot: 'h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg',
    right: 'h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg'
  }
});
tv({
  slots: {
    base: 'relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-t-xl h-[172px] max-w-[301px] md:h-[294px] md:max-w-[512px]',
    inner: 'rounded-lg overflow-hidden h-[156px] md:h-[278px] bg-white dark:bg-gray-800',
    bot: 'relative mx-auto bg-gray-900 dark:bg-gray-700 rounded-b-xl rounded-t-sm h-[17px] max-w-[351px] md:h-[21px] md:max-w-[597px]',
    botCen:
      'absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl w-[56px] h-[5px] md:w-[96px] md:h-[8px] bg-gray-800'
  }
});
tv({
  slots: {
    base: 'relative mx-auto bg-gray-800 dark:bg-gray-700 rounded-t-[2.5rem] h-[63px] max-w-[133px]',
    slot: 'rounded-[2rem] overflow-hidden h-[193px] w-[188px]',
    rightTop:
      'h-[41px] w-[6px] bg-gray-800 dark:bg-gray-800 absolute -right-[16px] top-[40px] rounded-r-lg',
    rightBot:
      'h-[32px] w-[6px] bg-gray-800 dark:bg-gray-800 absolute -right-[16px] top-[88px] rounded-r-lg',
    top: 'relative mx-auto border-gray-900 dark:bg-gray-800 dark:border-gray-800 border-[10px] rounded-[2.5rem] h-[213px] w-[208px]',
    bot: 'relative mx-auto bg-gray-800 dark:bg-gray-700 rounded-b-[2.5rem] h-[63px] max-w-[133px]'
  }
});
tv({
  slots: {
    base: 'relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[454px] max-w-[341px] md:h-[682px] md:max-w-[512px]',
    slot: 'rounded-[2rem] overflow-hidden h-[426px] md:h-[654px] bg-white dark:bg-gray-800',
    leftTop:
      'h-[32px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg',
    leftMid:
      'h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg',
    leftBot:
      'h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg',
    right:
      'h-[64px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg'
  }
});
const dialog = tv({
  slots: {
    base: 'backdrop:bg-gray-900/50 open:flex flex-col bg-white dark:bg-gray-800',
    form: 'flex flex-col w-full border-inherit dark:border-inherit divide-inherit dark:divide-inherit',
    close: 'absolute top-2.5 end-2.5'
  },
  variants: {
    // position: {
    //     fixed: { base: "fixed" },
    //     absolute: { base: "absolute" }
    // },
  },
  defaultVariants: {
    // position: "fixed"
  }
});
tv({
  base: 'mt-2 divide-y divide-gray-300 dark:divide-gray-500 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-700'
});
tv({
  base: 'my-1 h-px bg-gray-100 dark:bg-gray-500'
});
tv({
  base: 'px-4 py-3 text-sm text-gray-900 dark:text-white'
});
tv({
  slots: {
    base: 'block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white',
    active:
      'block px-4 py-2 text-primary-700 dark:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white',
    li: ''
  }
});
tv({
  base: 'py-2 text-sm text-gray-700 dark:text-gray-200'
});
tv({
  extend: dialog,
  slots: {
    base: 'p-4 max-h-none max-w-none border border-gray-200 dark:border-gray-700 transform-gpu will-change-transform'
  },
  variants: {
    placement: {
      left: { base: 'me-auto h-full' },
      right: { base: 'ms-auto h-full' },
      top: { base: 'mb-auto !w-full' },
      bottom: { base: 'mt-auto !w-full' }
    },
    width: {
      default: { base: 'w-80' },
      full: { base: 'w-full' },
      half: { base: 'w-1/2' }
    },
    modal: {
      false: { base: 'fixed inset-0' },
      true: { base: '' }
    },
    shifted: {
      true: {},
      false: {}
    }
  },
  compoundVariants: [
    {
      shifted: false,
      modal: false,
      class: { base: 'z-50' }
    },
    {
      shifted: true,
      placement: 'left',
      class: { base: '-translate-x-full' }
    },
    {
      shifted: true,
      placement: 'right',
      class: { base: 'translate-x-full' }
    },
    {
      shifted: true,
      placement: 'top',
      class: { base: '-translate-y-full' }
    },
    {
      shifted: true,
      placement: 'bottom',
      class: { base: 'translate-y-full' }
    }
  ],
  defaultVariants: {
    placement: 'left',
    width: 'default',
    modal: true
  }
});
tv({
  slots: {
    base: 'flex items-center justify-between',
    button:
      'ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white',
    svg: 'h-4 w-4'
  }
});
tv({
  slots: {
    base: 'p-4 absolute flex select-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-500',
    handle: 'absolute rounded-lg bg-gray-300 dark:bg-gray-600'
  },
  variants: {
    placement: {
      left: { base: 'inset-y-0 right-0 touch-pan-x', handle: 'w-1 h-8 top-1/2 -translate-y-1/2' },
      right: { base: 'inset-y-0 left-0 touch-pan-x', handle: 'w-1 h-8 top-1/2 -translate-y-1/2' },
      top: { base: 'inset-x-0 bottom-0 touch-pan-y', handle: 'w-8 h-1 left-1/2 -translate-x-1/2' },
      bottom: { base: 'inset-x-0 top-0 touch-pan-y', handle: 'w-8 h-1 left-1/2 -translate-x-1/2' }
    }
  }
});
tv({
  base: 'bg-white dark:bg-gray-800',
  variants: {
    footerType: {
      default: 'p-4 rounded-lg shadow md:flex md:items-center md:justify-between md:p-6',
      sitemap: 'bg-white dark:bg-gray-900',
      socialmedia: 'p-4 sm:p-6',
      logo: 'p-4 rounded-lg shadow md:px-6 md:py-8',
      sticky:
        'fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800 dark:border-gray-600'
    }
  }
});
tv({
  slots: {
    base: 'flex items-center',
    span: 'self-center text-2xl font-semibold whitespace-nowrap dark:text-white',
    img: 'me-3 h-8'
  }
});
tv({
  slots: {
    base: 'block text-sm text-gray-500 sm:text-center dark:text-gray-400',
    link: 'hover:underline',
    bySpan: 'ms-1'
  }
});
tv({
  base: 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
});
tv({
  base: 'text-gray-600 dark:text-gray-400'
});
tv({
  slots: {
    base: 'me-4 last:me-0 md:me-6',
    link: 'hover:underline'
  }
});
tv({
  slots: {
    image: 'h-auto max-w-full rounded-lg',
    div: 'grid'
  }
});
tv({
  base: 'px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500'
});
tv({
  base: 'flex bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 divide-gray-200 dark:divide-gray-600',
  variants: {
    rounded: {
      true: 'rounded-lg',
      false: ''
    },
    border: {
      true: 'border border-gray-200 dark:border-gray-700',
      false: ''
    },
    horizontal: {
      true: 'flex-row divide-x',
      false: 'flex-col divide-y'
    }
  },
  compoundVariants: [
    {
      border: true,
      class: 'divide-gray-200 dark:divide-gray-700'
    }
  ],
  defaultVariants: {
    rounded: true,
    border: true,
    horizontal: false
  }
});
tv({
  base: 'py-2 px-4 w-full text-sm font-medium list-none flex items-center text-left gap-2',
  variants: {
    state: {
      normal: '',
      current: 'text-white bg-primary-700 dark:text-white dark:bg-gray-800',
      disabled: 'text-gray-900 bg-gray-100 dark:bg-gray-600 dark:text-gray-400'
    },
    active: {
      true: '',
      false: ''
    },
    horizontal: {
      true: 'first:rounded-s-lg last:rounded-e-lg',
      false: 'first:rounded-t-lg last:rounded-b-lg'
    }
  },
  compoundVariants: [
    {
      active: true,
      state: 'disabled',
      class: 'cursor-not-allowed'
    },
    {
      active: true,
      state: 'normal',
      class:
        'hover:bg-gray-100 hover:text-primary-700 dark:hover:bg-gray-600 dark:hover:text-white focus:z-40 focus:outline-hidden focus:ring-2 focus:ring-primary-700 focus:text-primary-700 dark:focus:ring-gray-500 dark:focus:text-white'
    }
    // {
    //   horizontal: true,
    //   class: "focus:first:rounded-s-lg focus:last:rounded-e-lg"
    // },
    // {
    //   horizontal: false,
    //   class: "focus:first:rounded-t-lg focus:last:rounded-b-lg"
    // }
  ]
});
tv({
  slots: {
    base: 'w-fit bg-white shadow-md dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-100 dark:border-gray-600 divide-gray-100 dark:divide-gray-600',
    div: 'flex flex-col md:flex-row p-4 max-w-(--breakpoint-md) justify-center mx-auto mt-2',
    ul: 'grid grid-flow-row gap-y-4 md:gap-x-0 auto-col-max auto-row-max grid-cols-2 md:grid-cols-3 text-sm font-medium',
    extra: 'md:w-1/3 mt-4 md:mt-0'
  },
  variants: {
    full: {
      true: { base: 'border-y shadow-xs w-full ml-0 rounded-none' }
    },
    hasExtra: {
      true: {}
    }
  },
  compoundVariants: [
    {
      full: true,
      hasExtra: true,
      class: { ul: 'grid-cols-2 md:w-2/3' }
    }
  ]
});
tv({
  extend: dialog,
  slots: {
    base: 'w-full rounded-lg divide-y text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 divide-gray-300 dark:divide-gray-700 bg-white dark:bg-gray-800 pointer-events-auto',
    form: 'rounded-lg divide-y',
    header:
      'flex items-center p-4 md:p-5 justify-between rounded-t-lg shrink-0 text-xl font-semibold text-gray-900 dark:text-white',
    footer: 'flex items-center p-4 md:p-5 space-x-3 rtl:space-x-reverse rounded-b-lg shrink-0',
    body: 'p-4 md:p-5 space-y-4 overflow-y-auto overscroll-contain'
  },
  variants: {
    fullscreen: {
      true: {
        base: 'fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 p-0 border-none rounded-none bg-white dark:bg-gray-900'
      }
    },
    placement: {
      'top-left': { base: 'mb-auto mr-auto' },
      'top-center': { base: 'mb-auto mx-auto' },
      'top-right': { base: 'mb-auto ml-auto' },
      'center-left': { base: 'my-auto mr-auto' },
      center: { base: 'my-auto mx-auto' },
      'center-right': { base: 'my-auto ml-auto' },
      'bottom-left': { base: 'mt-auto mr-auto' },
      'bottom-center': { base: 'mt-auto mx-auto' },
      'bottom-right': { base: 'mt-auto ml-auto' }
    },
    size: {
      none: { base: '' },
      xs: { base: 'max-w-md' },
      sm: { base: 'max-w-lg' },
      md: { base: 'max-w-2xl' },
      lg: { base: 'max-w-4xl' },
      xl: { base: 'max-w-7xl' }
    }
  },
  defaultVariants: {
    placement: 'center',
    size: 'md'
  }
});
tv({
  base: 'relative w-full px-2 py-2.5 sm:px-4'
});
tv({
  base: 'flex items-center'
});
tv({
  base: 'mx-auto flex flex-wrap items-center justify-between ',
  variants: {
    fluid: { true: 'w-full', false: 'container' }
  }
});
tv({
  slots: {
    base: '',
    ul: 'flex flex-col p-4 mt-0 rtl:space-x-reverse',
    active: 'text-white bg-primary-700 dark:bg-primary-600',
    nonActive:
      'hover:text-primary-500 text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
  },
  variants: {
    breakpoint: {
      sm: {
        base: 'w-full sm:block sm:w-auto',
        ul: 'sm:flex-row sm:text-sm sm:font-medium',
        active: 'sm:bg-transparent sm:text-primary-700 sm:dark:text-white sm:dark:bg-transparent',
        nonActive:
          'sm:hover:bg-transparent sm:border-0 sm:hover:text-primary-700 dark:sm:text-gray-400 sm:dark:hover:text-white sm:dark:hover:bg-transparent'
      },
      md: {
        base: 'w-full md:block md:w-auto',
        ul: 'md:flex-row md:text-sm md:font-medium',
        active: 'md:bg-transparent md:text-primary-700 md:dark:text-white md:dark:bg-transparent',
        nonActive:
          'md:hover:bg-transparent md:border-0 md:hover:text-primary-700 dark:md:text-gray-400 md:dark:hover:text-white md:dark:hover:bg-transparent'
      },
      lg: {
        base: 'w-full lg:block lg:w-auto',
        ul: 'lg:flex-row lg:text-sm lg:font-medium',
        active: 'lg:bg-transparent lg:text-primary-700 lg:dark:text-white lg:dark:bg-transparent',
        nonActive:
          'lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 dark:lg:text-gray-400 lg:dark:hover:text-white lg:dark:hover:bg-transparent'
      },
      xl: {
        base: 'w-full xl:block xl:w-auto',
        ul: 'xl:flex-row xl:text-sm xl:font-medium',
        active: 'xl:bg-transparent xl:text-primary-700 xl:dark:text-white xl:dark:bg-transparent',
        nonActive:
          'xl:hover:bg-transparent xl:border-0 xl:hover:text-primary-700 dark:xl:text-gray-400 xl:dark:hover:text-white xl:dark:hover:bg-transparent'
      }
    },
    hidden: {
      false: {
        base: 'absolute top-full left-0 right-0 z-50 w-full',
        ul: 'border rounded-lg bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-400 border-gray-100 dark:border-gray-700 divide-gray-100 dark:divide-gray-700'
      },
      true: {
        base: 'hidden'
      }
    }
  },
  compoundVariants: [
    // Compound variants for breakpoint + hidden combinations
    {
      breakpoint: 'sm',
      hidden: false,
      class: {
        base: 'sm:static sm:z-auto',
        ul: 'sm:border-none sm:rounded-none sm:bg-inherit dark:sm:bg-inherit sm:shadow-none'
      }
    },
    {
      breakpoint: 'md',
      hidden: false,
      class: {
        base: 'md:static md:z-auto',
        ul: 'md:border-none md:rounded-none md:bg-inherit dark:md:bg-inherit md:shadow-none'
      }
    },
    {
      breakpoint: 'lg',
      hidden: false,
      class: {
        base: 'lg:static lg:z-auto',
        ul: 'lg:border-none lg:rounded-none lg:bg-inherit dark:lg:bg-inherit lg:shadow-none'
      }
    },
    {
      breakpoint: 'xl',
      hidden: false,
      class: {
        base: 'xl:static xl:z-auto',
        ul: 'xl:border-none xl:rounded-none xl:bg-inherit dark:xl:bg-inherit xl:shadow-none'
      }
    }
  ],
  defaultVariants: {
    breakpoint: 'md'
  }
});
tv({
  base: 'block py-2 pe-4 ps-3 rounded-sm',
  variants: {
    breakpoint: {
      sm: 'sm:p-2 sm:border-0',
      md: 'md:p-2 md:border-0',
      lg: 'lg:p-2 lg:border-0',
      xl: 'xl:p-2 xl:border-0'
    },
    hidden: {
      false:
        'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
    }
  },
  compoundVariants: [
    {
      breakpoint: 'sm',
      hidden: false,
      class:
        'sm:hover:bg-transparent sm:hover:text-primary-700 sm:dark:hover:text-white sm:dark:hover:bg-transparent'
    },
    {
      breakpoint: 'md',
      hidden: false,
      class:
        'md:hover:bg-transparent md:hover:text-primary-700 md:dark:hover:text-white md:dark:hover:bg-transparent'
    },
    {
      breakpoint: 'lg',
      hidden: false,
      class:
        'lg:hover:bg-transparent lg:hover:text-primary-700 lg:dark:hover:text-white lg:dark:hover:bg-transparent'
    },
    {
      breakpoint: 'xl',
      hidden: false,
      class:
        'xl:hover:bg-transparent xl:hover:text-primary-700 xl:dark:hover:text-white xl:dark:hover:bg-transparent'
    }
  ],
  defaultVariants: {
    breakpoint: 'md'
  }
});
tv({
  slots: {
    base: 'ms-3',
    menu: 'h-6 w-6 shrink-0'
  },
  variants: {
    breakpoint: {
      sm: {
        base: 'sm:hidden'
      },
      md: {
        base: 'md:hidden'
      },
      lg: {
        base: 'lg:hidden'
      },
      xl: {
        base: 'xl:hidden'
      }
    }
  },
  defaultVariants: {
    breakpoint: 'md'
  }
});
tv({
  slots: {
    base: 'inline-flex -space-x-px rtl:space-x-reverse items-center',
    tableDiv: 'flex items-center text-sm mb-4',
    span: 'font-semibold mx-1',
    prev: 'rounded-none',
    next: 'rounded-none',
    active: ''
  },
  variants: {
    size: {
      default: '',
      large: ''
    },
    layout: {
      table: {
        prev: 'rounded-s bg-gray-800 hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white text-white  hover:text-gray-200',
        next: 'text-white bg-gray-800 border-0 border-s border-gray-700 rounded-e hover:bg-gray-900 hover:text-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
      },
      navigation: { prev: 'rounded-s-lg', next: 'rounded-e-lg' },
      pagination: { prev: 'rounded-s-lg', next: 'rounded-e-lg' }
    }
  },
  defaultVariants: {
    table: false,
    size: 'default'
  }
});
tv({
  base: 'flex items-center font-medium',
  variants: {
    size: {
      default: 'h-8 px-3 text-sm',
      large: 'h-10 px-4 text-base'
    },
    active: {
      true: 'text-primary-600 border border-gray-300 bg-primary-50 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white',
      false:
        'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
    },
    group: {
      true: '',
      false: 'rounded-lg'
    },
    table: {
      true: 'rounded-sm',
      false: 'border'
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
      false: ''
    }
  },
  compoundVariants: [
    {
      group: false,
      table: false,
      class: 'rounded-lg'
    }
  ],
  defaultVariants: {
    size: 'default',
    active: false,
    group: false,
    table: false
  }
});
tv({
  base: 'flex items-center font-medium',
  variants: {
    size: {
      default: 'h-8 px-3 text-sm',
      large: 'h-10 px-4 text-base'
    },
    active: {
      true: 'text-primary-600 border border-gray-300 bg-primary-50 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white',
      false:
        'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
    },
    group: {
      true: '',
      false: 'rounded-lg'
    },
    table: {
      true: 'rounded-sm',
      false: 'border'
    }
  },
  compoundVariants: [
    {
      group: false,
      table: false,
      class: 'rounded-lg'
    }
  ],
  defaultVariants: {
    size: 'default',
    active: false,
    group: false,
    table: false
  }
});
tv({
  base: 'inline-flex -space-x-px rtl:space-x-reverse items-center',
  variants: {
    table: {
      true: 'divide-x rtl:divide-x-reverse dark divide-gray-700 dark:divide-gray-700',
      false: ''
    },
    size: {
      default: '',
      large: ''
    }
  },
  defaultVariants: {
    table: false,
    size: 'default'
  }
});
tv({
  slots: {
    base: 'rounded-lg shadow-md bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700',
    content: 'p-2',
    title: 'py-2 px-3 rounded-t-md border-b ',
    h3: 'font-semibold'
  },
  variants: {
    color: {
      default: {
        title: 'bg-gray-100 border-gray-200 dark:border-gray-600 dark:bg-gray-700',
        h3: 'text-gray-900 dark:text-white'
      },
      primary: {
        title: 'bg-primary-700',
        h3: 'text-white'
      },
      secondary: {
        title: 'bg-secondary-700',
        h3: 'text-white'
      },
      gray: {
        title: 'bg-gray-700',
        h3: 'text-white'
      },
      red: {
        title: 'bg-red-700',
        h3: 'text-white'
      },
      orange: {
        title: 'bg-orange-700',
        h3: 'text-white'
      },
      amber: {
        title: 'bg-amber-700',
        h3: 'text-white'
      },
      yellow: {
        title: 'bg-yellow-500',
        h3: 'text-gray-800'
      },
      lime: {
        title: 'bg-lime-700',
        h3: 'text-white'
      },
      green: {
        title: 'bg-green-700',
        h3: 'text-white'
      },
      emerald: {
        title: 'bg-emerald-700',
        h3: 'text-white'
      },
      teal: {
        title: 'bg-teal-700',
        h3: 'text-white'
      },
      cyan: {
        title: 'bg-cyan-700',
        h3: 'text-white'
      },
      sky: {
        title: 'bg-sky-700',
        h3: 'text-white'
      },
      blue: {
        title: 'bg-blue-700',
        h3: 'text-white'
      },
      indigo: {
        title: 'bg-indigo-700',
        h3: 'text-white'
      },
      violet: {
        title: 'bg-violet-700',
        h3: 'text-white'
      },
      purple: {
        title: 'bg-purple-700',
        h3: 'text-white'
      },
      fuchsia: {
        title: 'bg-fuchsia-700',
        h3: 'text-white'
      },
      pink: {
        title: 'bg-pink-700',
        h3: 'text-white'
      },
      rose: {
        title: 'bg-rose-700',
        h3: 'text-white'
      }
    }
  }
});
tv({
  slots: {
    base: 'w-full bg-gray-200 rounded-full dark:bg-gray-700',
    label: 'text-primary-100 text-xs font-medium text-center leading-none rounded-full',
    inside: 'rounded-full',
    outside: 'mb-1 flex justify-between',
    span: 'text-base font-medium dark:text-white',
    progressCls: 'text-sm font-medium dark:text-white'
  },
  variants: {
    color: {
      primary: {
        label: 'bg-primary-600',
        inside: 'bg-primary-600'
      },
      secondary: {
        label: 'bg-secondary-600',
        inside: 'bg-secondary-600'
      },
      gray: {
        label: 'bg-gray-600 dark:bg-gray-300',
        inside: 'bg-gray-600 dark:bg-gray-300'
      },
      red: {
        label: 'bg-red-600 dark:bg-red-500',
        inside: 'bg-red-600 dark:bg-red-500'
      },
      orange: {
        label: 'bg-orange-600 dark:bg-orange-500',
        inside: 'bg-orange-600 dark:bg-orange-500'
      },
      amber: {
        label: 'bg-amber-600 dark:bg-amber-500',
        inside: 'bg-amber-600 dark:bg-amber-500'
      },
      yellow: {
        label: 'bg-yellow-400',
        inside: 'bg-yellow-400'
      },
      lime: {
        label: 'bg-lime-600 dark:bg-lime-500',
        inside: 'bg-lime-600 dark:bg-lime-500'
      },
      green: {
        label: 'bg-green-600 dark:bg-green-500',
        inside: 'bg-green-600 dark:bg-green-500'
      },
      emerald: {
        label: 'bg-emerald-600 dark:bg-emerald-500',
        inside: 'bg-emerald-600 dark:bg-emerald-500'
      },
      teal: {
        label: 'bg-teal-600 dark:bg-teal-500',
        inside: 'bg-teal-600 dark:bg-teal-500'
      },
      cyan: {
        label: 'bg-cyan-600 dark:bg-cyan-500',
        inside: 'bg-cyan-600 dark:bg-cyan-500'
      },
      sky: {
        label: 'bg-sky-600 dark:bg-sky-500',
        inside: 'bg-sky-600 dark:bg-sky-500'
      },
      blue: {
        label: 'bg-blue-600',
        inside: 'bg-blue-600'
      },
      indigo: {
        label: 'bg-indigo-600 dark:bg-indigo-500',
        inside: 'bg-indigo-600 dark:bg-indigo-500'
      },
      violet: {
        label: 'bg-violet-600 dark:bg-violet-500',
        inside: 'bg-violet-600 dark:bg-violet-500'
      },
      purple: {
        label: 'bg-purple-600 dark:bg-purple-500',
        inside: 'bg-purple-600 dark:bg-purple-500'
      },
      fuchsia: {
        label: 'bg-fuchsia-600 dark:bg-fuchsia-500',
        inside: 'bg-fuchsia-600 dark:bg-fuchsia-500'
      },
      pink: {
        label: 'bg-pink-600 dark:bg-pink-500',
        inside: 'bg-pink-600 dark:bg-pink-500'
      },
      rose: {
        label: 'bg-rose-600 dark:bg-rose-500',
        inside: 'bg-rose-600 dark:bg-rose-500'
      }
    },
    labelInside: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [
    {
      labelInside: true,
      class: {
        base: 'text-primary-100 text-xs font-medium text-center leading-none rounded-full',
        label: 'p-0.5'
      }
    },
    {
      labelInside: false,
      class: { base: 'rounded-full' }
    }
  ],
  defaultVariants: {
    color: 'primary',
    labelInside: false
  }
});
tv({
  slots: {
    base: 'relative inline-flex',
    label: 'absolute inset-0 flex items-center justify-center text-sm font-medium',
    background: 'opacity-25',
    foreground: 'transition-all',
    outside: 'flex flex-col items-center mb-2 text-center',
    span: 'text-base font-medium',
    progressCls: 'text-sm font-medium ml-1'
  },
  variants: {
    color: {
      primary: {
        background: 'stroke-primary-600',
        foreground: 'stroke-primary-600'
      },
      secondary: {
        background: 'stroke-secondary-600',
        foreground: 'stroke-secondary-600'
      },
      gray: {
        background: 'stroke-gray-600 dark:stroke-gray-300',
        foreground: 'stroke-gray-600 dark:stroke-gray-300'
      },
      red: {
        background: 'stroke-red-600 dark:stroke-red-500',
        foreground: 'stroke-red-600 dark:stroke-red-500'
      },
      orange: {
        background: 'stroke-orange-600 dark:stroke-orange-500',
        foreground: 'stroke-orange-600 dark:stroke-orange-500'
      },
      amber: {
        background: 'stroke-amber-600 dark:stroke-amber-500',
        foreground: 'stroke-amber-600 dark:stroke-amber-500'
      },
      yellow: {
        background: 'stroke-yellow-400',
        foreground: 'stroke-yellow-400'
      },
      lime: {
        background: 'stroke-lime-600 dark:stroke-lime-500',
        foreground: 'stroke-lime-600 dark:stroke-lime-500'
      },
      green: {
        background: 'stroke-green-600 dark:stroke-green-500',
        foreground: 'stroke-green-600 dark:stroke-green-500'
      },
      emerald: {
        background: 'stroke-emerald-600 dark:stroke-emerald-500',
        foreground: 'stroke-emerald-600 dark:stroke-emerald-500'
      },
      teal: {
        background: 'stroke-teal-600 dark:stroke-teal-500',
        foreground: 'stroke-teal-600 dark:stroke-teal-500'
      },
      cyan: {
        background: 'stroke-cyan-600 dark:stroke-cyan-500',
        foreground: 'stroke-cyan-600 dark:stroke-cyan-500'
      },
      sky: {
        background: 'stroke-sky-600 dark:stroke-sky-500',
        foreground: 'stroke-sky-600 dark:stroke-sky-500'
      },
      blue: {
        background: 'stroke-blue-600',
        foreground: 'stroke-blue-600'
      },
      indigo: {
        background: 'stroke-indigo-600 dark:stroke-indigo-500',
        foreground: 'stroke-indigo-600 dark:stroke-indigo-500'
      },
      violet: {
        background: 'stroke-violet-600 dark:stroke-violet-500',
        foreground: 'stroke-violet-600 dark:stroke-violet-500'
      },
      purple: {
        background: 'stroke-purple-600 dark:stroke-purple-500',
        foreground: 'stroke-purple-600 dark:stroke-purple-500'
      },
      fuchsia: {
        background: 'stroke-fuchsia-600 dark:stroke-fuchsia-500',
        foreground: 'stroke-fuchsia-600 dark:stroke-fuchsia-500'
      },
      pink: {
        background: 'stroke-pink-600 dark:stroke-pink-500',
        foreground: 'stroke-pink-600 dark:stroke-pink-500'
      },
      rose: {
        background: 'stroke-rose-600 dark:stroke-rose-500',
        foreground: 'stroke-rose-600 dark:stroke-rose-500'
      }
    },
    labelInside: {
      true: {}
    }
  }
});
tv({
  // divClass = 'flex items-center mt-4', spanClass = 'text-sm font-medium text-gray-600 dark:text-gray-500', div2Class = 'mx-4 w-2/4 h-5 bg-gray-200 rounded-sm dark:bg-gray-700', div3Class = 'h-5 bg-yellow-400 rounded-sm', span2Class = 'text-sm font-medium text-gray-600 dark:text-gray-500',
  slots: {
    base: 'flex items-center mt-4',
    span: 'text-sm font-medium text-gray-600 dark:text-gray-500',
    div2: 'mx-4 w-2/4 h-5 bg-gray-200 rounded-sm dark:bg-gray-700',
    div3: 'h-5 bg-yellow-400 rounded-sm',
    span2: 'text-sm font-medium text-gray-600 dark:text-gray-500'
  }
});
tv({
  slots: {
    base: 'flex items-center',
    p: 'ms-2 text-sm font-bold text-gray-900 dark:text-white'
  }
});
tv({
  slots: {
    article: 'md:grid md:grid-cols-3 md:gap-8',
    div: 'mb-6 flex items-center space-x-4 rtl:space-x-reverse',
    div2: 'space-y-1 font-medium dark:text-white',
    div3: 'flex items-center text-sm text-gray-500 dark:text-gray-400',
    img: 'h-10 w-10 rounded-full',
    ul: 'space-y-4 text-sm text-gray-500 dark:text-gray-400',
    li: 'flex items-center'
  }
});
tv({
  slots: {
    desc1:
      'bg-primary-100 w-8 text-primary-800 text-sm font-semibold inline-flex items-center p-1.5 rounded-sm dark:bg-primary-200 dark:text-primary-800',
    desc2: 'ms-2 font-medium text-gray-900 dark:text-white',
    desc3span: 'text-sm w-24 font-medium text-gray-500 dark:text-gray-400',
    desc3p: 'text-sm w-24 font-medium text-gray-500 dark:text-gray-400',
    link: 'ms-auto w-32 text-sm font-medium text-primary-600 hover:underline dark:text-primary-500',
    bar: 'bg-primary-600 h-2.5 rounded-sm dark:bg-primary-500'
  }
});
const sidebar = tv({
  slots: {
    base: 'top-0 left-0 z-50 w-64 transition-transform bg-gray-50 dark:bg-gray-800',
    active:
      'flex items-center group-has-[ul]:ms-6 p-2 text-base font-normal text-gray-900 bg-gray-200 dark:bg-gray-700 rounded-sm dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700',
    nonactive:
      'flex items-center group-has-[ul]:ms-6 p-2 text-base font-normal text-gray-900 rounded-sm dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700',
    div: 'overflow-y-auto px-3 py-4 bg-gray-50 dark:bg-gray-800',
    backdrop: 'fixed top-0 start-0 z-40 w-full h-full'
  },
  variants: {
    position: {
      fixed: { base: 'fixed' },
      absolute: { base: 'absolute' },
      static: { base: 'static' }
    },
    isOpen: {
      true: 'block',
      false: 'hidden'
    },
    breakpoint: {
      sm: { base: 'sm:block' },
      md: { base: 'md:block' },
      lg: { base: 'lg:block' },
      xl: { base: 'xl:block' },
      '2xl': { base: '2xl:block' }
    },
    alwaysOpen: {
      true: { base: 'block' }
      // Always display the sidebar when alwaysOpen is true
    },
    backdrop: {
      true: { backdrop: 'bg-gray-900 opacity-75' }
    }
  },
  compoundVariants: [
    // When alwaysOpen is true, override the breakpoint display classes
    {
      alwaysOpen: true,
      class: {
        base: '!block'
      }
    }
  ]
});
tv({
  slots: {
    base: 'inline-flex items-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600',
    svg: 'h-6 w-6 m-2'
  },
  variants: {
    breakpoint: {
      sm: 'sm:hidden',
      md: 'md:hidden',
      lg: 'lg:hidden',
      xl: 'xl:hidden',
      '2xl': '2xl:hidden'
    }
  }
});
tv({
  slots: {
    base: 'flex items-center ps-2.5 mb-5',
    img: 'h-6 me-3 sm:h-7',
    span: 'self-center text-xl font-semibold whitespace-nowrap dark:text-white'
  }
});
tv({
  slots: {
    base: 'p-4 mt-6 bg-primary-50 rounded-lg dark:bg-primary-900',
    div: 'flex items-center mb-3',
    span: 'bg-primary-100 text-primary-800 text-sm font-semibold me-2 px-2.5 py-0.5 rounded-sm dark:bg-primary-200 dark:text-primary-900'
  }
});
tv({
  slots: {
    base: 'group',
    btn: 'flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-sm transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700',
    span: 'flex-1 ms-3 text-left whitespace-nowrap',
    svg: 'h-3 w-3 text-gray-800 dark:text-white',
    ul: 'py-2 space-y-0'
  }
});
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      isOpen = false,
      closeSidebar,
      isSingle = true,
      breakpoint = 'md',
      alwaysOpen = false,
      position = 'fixed',
      activateClickOutside = true,
      backdrop = true,
      backdropClass,
      transition = fly,
      params,
      divClass,
      ariaLabel,
      nonActiveClass,
      activeClass,
      activeUrl = '',
      class: className,
      classes,
      disableBreakpoints = false,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const styling = classes ?? {
      backdrop: backdropClass,
      div: divClass,
      nonactive: nonActiveClass,
      active: activeClass
    };
    const theme = getTheme('sidebar');
    const breakpointValues = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };
    let innerWidth = -1;
    let isLargeScreen = disableBreakpoints
      ? false
      : alwaysOpen || innerWidth >= breakpointValues[breakpoint];
    const activeUrlStore = { value: '' };
    setContext('activeUrl', activeUrlStore);
    if (disableBreakpoints) isOpen = true;
    const {
      base,
      active,
      nonactive,
      div,
      backdrop: backdropCls
    } = sidebar({
      isOpen,
      breakpoint,
      position,
      backdrop,
      alwaysOpen: alwaysOpen && !disableBreakpoints
    });
    let sidebarCtx = {
      get closeSidebar() {
        return closeSidebar;
      },
      get activeClass() {
        return active({ class: clsx(theme?.active, styling.active) });
      },
      get nonActiveClass() {
        return nonactive({ class: clsx(theme?.nonactive, styling.nonactive) });
      },
      isSingle
    };
    setContext('sidebarContext', sidebarCtx);
    if (!disableBreakpoints) {
      $$renderer2.push('<!--[-->');
      if (isOpen || isLargeScreen) {
        $$renderer2.push('<!--[-->');
        if (isOpen && !alwaysOpen) {
          $$renderer2.push('<!--[-->');
          if (backdrop && activateClickOutside) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(
              `<div role="presentation"${attr_class(clsx$1(backdropCls({ class: clsx(theme?.backdrop, styling.backdrop) })))}></div>`
            );
          } else {
            $$renderer2.push('<!--[!-->');
            if (backdrop && !activateClickOutside) {
              $$renderer2.push('<!--[-->');
              $$renderer2.push(
                `<div role="presentation"${attr_class(clsx$1(backdropCls({ class: clsx(theme?.backdrop, styling.backdrop) })))}></div>`
              );
            } else {
              $$renderer2.push('<!--[!-->');
              if (!backdrop && activateClickOutside) {
                $$renderer2.push('<!--[-->');
                $$renderer2.push(
                  `<div role="presentation" class="fixed start-0 top-0 z-50 h-full w-full"></div>`
                );
              } else {
                $$renderer2.push('<!--[!-->');
                if (!backdrop && !activateClickOutside) {
                  $$renderer2.push('<!--[-->');
                  $$renderer2.push(
                    `<div role="presentation" class="fixed start-0 top-0 z-50 h-full w-full"></div>`
                  );
                } else {
                  $$renderer2.push('<!--[!-->');
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(
          `<!--]--> <aside${attributes({
            ...restProps,
            class: clsx$1(base({ class: clsx(theme?.base, className) })),
            'aria-label': ariaLabel
          })}><div${attr_class(clsx$1(div({ class: clsx(theme?.base, styling.div) })))}>`
        );
        children($$renderer2);
        $$renderer2.push(`<!----></div></aside>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push('<!--[!-->');
      $$renderer2.push(
        `<aside${attributes({
          ...restProps,
          class: clsx$1(base({ class: clsx(theme?.base, className) })),
          'aria-label': ariaLabel
        })}><div${attr_class(clsx$1(div({ class: clsx(theme?.base, styling.div) })))}>`
      );
      children($$renderer2);
      $$renderer2.push(`<!----></div></aside>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function SidebarGroup($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      class: className = 'space-y-2',
      borderClass = 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700',
      border = false,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(
      `<ul${attributes({
        ...restProps,
        class: clsx$1(border ? clsx(borderClass) : clsx(className))
      })}>`
    );
    children($$renderer2);
    $$renderer2.push(`<!----></ul>`);
  });
}
function SidebarItem($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      icon,
      subtext,
      href,
      label: label2,
      spanClass = 'ms-3',
      activeClass,
      nonActiveClass,
      aClass,
      active,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const context = getContext('sidebarContext') ?? {};
    const activeUrl = getContext('activeUrl');
    let activeItem =
      active !== void 0 ? active : activeUrl?.value ? href === activeUrl?.value : false;
    let aCls =
      (activeItem ?? activeUrl?.value === href)
        ? (activeClass ?? context.activeClass)
        : (nonActiveClass ?? context.nonActiveClass);
    $$renderer2.push(
      `<li${attr_class(clsx$1(clsx(className)))}><a${attributes({
        ...restProps,
        href,
        'aria-current': (activeItem ?? activeUrl?.value === href) ? 'page' : void 0,
        class: clsx$1(clsx(aCls, aClass))
      })}>`
    );
    if (icon) {
      $$renderer2.push('<!--[-->');
      icon($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(
      `<!--]--> <span${attr_class(clsx$1(clsx(spanClass)))}>${escape_html(label2)}</span> `
    );
    if (subtext) {
      $$renderer2.push('<!--[-->');
      subtext($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></a></li>`);
  });
}
tv({
  slots: {
    base: 'p-4 rounded-sm border border-gray-200 shadow-sm animate-pulse md:p-6 dark:border-gray-700',
    area: 'mb-4 flex h-48 items-center justify-center rounded-sm bg-gray-300 dark:bg-gray-700',
    icon: 'text-gray-200 dark:text-gray-600',
    line: 'rounded-full bg-gray-200 dark:bg-gray-700',
    footer: 'mt-4 flex items-center space-x-3 rtl:space-x-reverse'
  },
  variants: {
    size: {
      sm: { base: 'max-w-sm' },
      md: { base: 'max-w-md' },
      lg: { base: 'max-w-lg' },
      xl: { base: 'max-w-xl' },
      '2xl': { base: 'max-w-2xl' }
    }
  }
});
tv({
  slots: {
    base: 'space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center',
    image:
      'flex w-full items-center justify-center rounded-sm bg-gray-300 sm:w-96 dark:bg-gray-700',
    svg: 'text-gray-200',
    content: 'w-full',
    line: 'rounded-full bg-gray-200 dark:bg-gray-700'
  },
  variants: {
    size: {
      sm: {
        image: 'h-32',
        content: 'space-y-2'
      },
      md: {
        image: 'h-48',
        content: 'space-y-3'
      },
      lg: {
        image: 'h-64',
        content: 'space-y-4'
      }
    },
    rounded: {
      none: {
        image: 'rounded-none',
        line: 'rounded-none'
      },
      sm: {
        image: 'rounded-xs',
        line: 'rounded-xs'
      },
      md: {
        image: 'rounded-sm',
        line: 'rounded-sm'
      },
      lg: {
        image: 'rounded-lg',
        line: 'rounded-lg'
      },
      full: {
        image: 'rounded-full',
        line: 'rounded-full'
      }
    }
  }
});
tv({
  slots: {
    base: 'p-4 space-y-4 max-w-md rounded-sm border border-gray-200 divide-y divide-gray-200 shadow-sm animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700',
    item: 'flex items-center justify-between',
    content: '',
    title: 'mb-2.5 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600',
    subTitle: 'h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700',
    extra: 'h-2.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700'
  },
  variants: {
    size: {
      sm: {
        base: 'p-3 space-y-3 max-w-sm md:p-4',
        title: 'mb-2 h-2 w-20',
        subTitle: 'h-1.5 w-28',
        extra: 'h-2 w-10'
      },
      md: {},
      // default size
      lg: {
        base: 'p-5 space-y-5 max-w-lg md:p-7',
        title: 'mb-3 h-3 w-28',
        subTitle: 'h-2.5 w-36',
        extra: 'h-3 w-14'
      }
    },
    rounded: {
      none: { base: 'rounded-none' },
      sm: { base: 'rounded-xs' },
      md: { base: 'rounded-sm' },
      lg: { base: 'rounded-lg' },
      full: { base: 'rounded-full p-8 md:p-16' }
    }
  }
});
tv({
  slots: {
    wrapper: 'animate-pulse',
    line: 'rounded-full bg-gray-200 dark:bg-gray-700'
  },
  variants: {
    size: {
      sm: {
        wrapper: 'max-w-sm'
      },
      md: {
        wrapper: 'max-w-md'
      },
      lg: {
        wrapper: 'max-w-lg'
      },
      xl: {
        wrapper: 'max-w-xl'
      },
      '2xl': {
        wrapper: 'max-w-2xl'
      }
    }
  }
});
tv({
  slots: {
    base: 'animate-pulse',
    lineA: 'rounded-full bg-gray-200 dark:bg-gray-700',
    lineB: 'rounded-full bg-gray-300 dark:bg-gray-700',
    svg: 'me-2 h-10 w-10 text-gray-200 dark:text-gray-700',
    content: 'mt-4 flex items-center justify-center'
  }
});
tv({
  slots: {
    base: 'space-y-2.5 animate-pulse',
    div: 'flex items-center space-x-2 rtl:space-x-reverse',
    lineA: 'rounded-full bg-gray-200 dark:bg-gray-700',
    lineB: 'rounded-full bg-gray-300 dark:bg-gray-600'
  },
  variants: {
    size: {
      sm: { base: 'max-w-sm' },
      md: { base: 'max-w-md' },
      lg: { base: 'max-w-lg' },
      xl: { base: 'max-w-xl' },
      '2xl': { base: 'max-w-2xl' }
    }
  }
});
tv({
  base: 'flex justify-center items-center h-56 bg-gray-300 rounded-lg animate-pulse dark:bg-gray-700',
  variants: {
    size: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl'
    }
  }
});
tv({
  slots: {
    base: 'p-4 max-w-sm rounded-sm border border-gray-200 shadow-sm animate-pulse md:p-6 dark:border-gray-700',
    wrapper: 'mt-4 flex items-baseline space-x-6 rtl:space-x-reverse',
    hLine: 'rounded-full bg-gray-200 dark:bg-gray-700',
    vLine: 'w-full rounded-t-lg bg-gray-200 dark:bg-gray-700'
  }
});
tv({
  slots: {
    base: 'group bg-transparent',
    popper: 'flex items-center gap-2 bg-transparent text-inherit'
  },
  variants: {
    vertical: {
      true: { popper: 'flex-col' }
    }
  },
  defaultVariants: {
    vertical: false
  }
});
tv({
  slots: {
    base: 'w-[52px] h-[52px] shadow-xs p-0',
    span: 'mb-px text-xs font-medium'
  },
  variants: {
    noTooltip: {
      false: {},
      true: {}
    },
    textOutside: {
      true: {
        base: 'relative',
        span: 'absolute -start-12 top-1/2 mb-px text-sm font-medium -translate-y-1/2'
      }
    }
  },
  compoundVariants: [{ noTooltip: true, textOutside: false, class: { base: 'flex flex-col' } }],
  defaultVariants: {}
});
tv({
  base: 'px-3 py-2 rounded-lg text-sm z-50 pointer-events-none',
  variants: {
    type: {
      light:
        'bg-white text-gray-800 dark:bg-white dark:text-gray-800 border border-gray-200 dark:border-gray-200',
      auto: 'bg-white text-gray-800 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700',
      dark: 'bg-gray-800 text-white dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700',
      custom: ''
    },
    color: {
      // default: "bg-gray-800 dark:bg-gray-300 dark:text-gray-800",
      primary: 'bg-primary-600 dark:bg-primary-600',
      secondary: 'bg-secondary-600 dark:bg-secondary-600',
      gray: 'bg-gray-600 dark:bg-gray-600',
      red: 'bg-red-600 dark:bg-red-600',
      orange: 'bg-orange-600 dark:bg-orange-600',
      amber: 'bg-amber-600 dark:bg-amber-600',
      yellow: 'bg-yellow-400 dark:bg-yellow-400',
      lime: 'bg-lime-600 dark:bg-lime-600',
      green: 'bg-green-600 dark:bg-green-600',
      emerald: 'bg-emerald-600 dark:bg-emerald-600',
      teal: 'bg-teal-600 dark:bg-teal-600',
      cyan: 'bg-cyan-600 dark:bg-cyan-600',
      sky: 'bg-sky-600 dark:bg-sky-600',
      blue: 'bg-blue-600 dark:bg-blue-600',
      indigo: 'bg-indigo-600 dark:bg-indigo-600',
      violet: 'bg-violet-600 dark:bg-violet-600',
      purple: 'bg-purple-600 dark:bg-purple-600',
      fuchsia: 'bg-fuchsia-600 dark:bg-fuchsia-600',
      pink: 'bg-pink-600 dark:bg-pink-600',
      rose: 'bg-rose-800 dark:bg-rose-800'
    }
  },
  compoundVariants: [
    {
      color: [
        'primary',
        'secondary',
        'gray',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose'
      ],
      class: 'border-0 dark:border-0'
    }
  ],
  defaultVariants: {
    type: 'dark',
    color: void 0
  }
});
const spinner = tv({
  base: 'inline-block',
  variants: {
    type: {
      default: 'animate-spin',
      dots: 'inline-flex items-center justify-center',
      bars: 'inline-flex items-center justify-center',
      pulse: 'animate-pulse',
      orbit: ''
    },
    color: {
      primary: 'fill-primary-600 text-gray-300',
      secondary: 'fill-secondary-600 text-gray-300',
      gray: 'fill-gray-600 dark:fill-gray-300 text-gray-300',
      red: 'fill-red-600 text-gray-300',
      orange: 'fill-orange-500 text-gray-300',
      amber: 'fill-amber-500 text-gray-300',
      yellow: 'fill-yellow-400 text-gray-300',
      lime: 'fill-lime-500 text-gray-300',
      green: 'fill-green-500 text-gray-300',
      emerald: 'fill-emerald-500 text-gray-300',
      teal: 'fill-teal-500 text-gray-300',
      cyan: 'fill-cyan-500 text-gray-300',
      sky: 'fill-sky-500 text-gray-300',
      blue: 'fill-blue-600 text-gray-300',
      indigo: 'fill-indigo-600 text-gray-300',
      violet: 'fill-violet-600 text-gray-300',
      purple: 'fill-purple-600 text-gray-300',
      fuchsia: 'fill-fuchsia-600 text-gray-300',
      pink: 'fill-pink-600 text-gray-300',
      rose: 'fill-rose-600 text-gray-300'
    },
    size: {
      4: 'w-4 h-4',
      5: 'w-5 h-5',
      6: 'w-6 h-6',
      8: 'w-8 h-8',
      10: 'w-10 h-10',
      12: 'w-12 h-12',
      16: 'w-16 h-16'
    }
  },
  defaultVariants: {
    type: 'default',
    color: 'primary',
    size: '8'
  }
});
function Spinner($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      type = 'default',
      color = 'primary',
      size = '8',
      class: className,
      currentFill = 'inherit',
      currentColor = 'currentColor',
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const theme = getTheme('spinner');
    let spinnerClass = spinner({ type, color, size, class: clsx(theme, className) });
    if (type === 'default') {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<svg${attributes(
          {
            ...restProps,
            role: 'status',
            class: clsx$1(spinnerClass),
            viewBox: '0 0 100 101',
            fill: 'none'
          },
          void 0,
          void 0,
          void 0,
          3
        )}><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"${attr('fill', currentColor)}></path><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"${attr('fill', currentFill)}></path></svg>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
      if (type === 'dots') {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<svg${attributes(
            {
              ...restProps,
              role: 'status',
              class: clsx$1(spinnerClass),
              viewBox: '0 0 120 30',
              fill: 'currentColor'
            },
            void 0,
            void 0,
            void 0,
            3
          )}><circle cx="15" cy="15" r="15"><animate attributeName="r" values="15;9;15" dur="0.8s" repeatCount="indefinite"></animate><animate attributeName="fill-opacity" values="1;.5;1" dur="0.8s" repeatCount="indefinite"></animate></circle><circle cx="60" cy="15" r="9" fill-opacity="0.3"><animate attributeName="r" values="9;15;9" dur="0.8s" begin="0.2s" repeatCount="indefinite"></animate><animate attributeName="fill-opacity" values=".5;1;.5" dur="0.8s" begin="0.2s" repeatCount="indefinite"></animate></circle><circle cx="105" cy="15" r="15"><animate attributeName="r" values="15;9;15" dur="0.8s" begin="0.4s" repeatCount="indefinite"></animate><animate attributeName="fill-opacity" values="1;.5;1" dur="0.8s" begin="0.4s" repeatCount="indefinite"></animate></circle></svg>`
        );
      } else {
        $$renderer2.push('<!--[!-->');
        if (type === 'bars') {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<svg${attributes(
              {
                ...restProps,
                role: 'status',
                class: clsx$1(spinnerClass),
                viewBox: '0 0 135 140',
                fill: 'currentColor'
              },
              void 0,
              void 0,
              void 0,
              3
            )}><rect y="10" width="15" height="120" rx="6"><animate attributeName="height" values="120;60;120" dur="1.2s" repeatCount="indefinite"></animate><animate attributeName="y" values="10;40;10" dur="1.2s" repeatCount="indefinite"></animate></rect><rect x="30" y="10" width="15" height="120" rx="6"><animate attributeName="height" values="120;60;120" dur="1.2s" begin="0.2s" repeatCount="indefinite"></animate><animate attributeName="y" values="10;40;10" dur="1.2s" begin="0.2s" repeatCount="indefinite"></animate></rect><rect x="60" y="10" width="15" height="120" rx="6"><animate attributeName="height" values="120;60;120" dur="1.2s" begin="0.4s" repeatCount="indefinite"></animate><animate attributeName="y" values="10;40;10" dur="1.2s" begin="0.4s" repeatCount="indefinite"></animate></rect></svg>`
          );
        } else {
          $$renderer2.push('<!--[!-->');
          if (type === 'pulse') {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(
              `<svg${attributes(
                {
                  ...restProps,
                  role: 'status',
                  class: clsx$1(spinnerClass),
                  viewBox: '0 0 100 100'
                },
                void 0,
                void 0,
                void 0,
                3
              )}><circle cx="50" cy="50" r="8"${attr('fill', currentFill)}><animate attributeName="r" values="8;45" dur="1.5s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="0.9;0" dur="1.5s" repeatCount="indefinite"></animate></circle><circle cx="50" cy="50" r="8"${attr('fill', currentFill)}><animate attributeName="r" values="8;45" begin="0.5s" dur="1.5s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="0.9;0" begin="0.5s" dur="1.5s" repeatCount="indefinite"></animate></circle><circle cx="50" cy="50" r="8"${attr('fill', currentFill)}><animate attributeName="r" values="8;45" begin="1s" dur="1.5s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="0.9;0" begin="1s" dur="1.5s" repeatCount="indefinite"></animate></circle></svg>`
            );
          } else {
            $$renderer2.push('<!--[!-->');
            if (type === 'orbit') {
              $$renderer2.push('<!--[-->');
              $$renderer2.push(
                `<svg${attributes(
                  {
                    ...restProps,
                    role: 'status',
                    class: clsx$1(spinnerClass),
                    viewBox: '0 0 100 100',
                    fill: 'currentColor'
                  },
                  void 0,
                  void 0,
                  void 0,
                  3
                )}><g><circle cx="50" cy="20" r="8"></circle><circle cx="73.66" cy="65" r="8"></circle><circle cx="26.34" cy="65" r="8"></circle><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.2s" repeatCount="indefinite"></animateTransform></g></svg>`
              );
            } else {
              $$renderer2.push('<!--[!-->');
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
tv({
  slots: {
    base: 'space-y-2 dark:text-white',
    label: 'text-base font-semibold',
    container: 'flex w-full justify-between gap-2',
    wrapper: 'relative h-full w-full',
    step: 'h-full w-full rounded-xs',
    glow: 'absolute -inset-1 rounded-xs opacity-30 blur-sm dark:opacity-25',
    incomplete: 'h-full w-full rounded-xs bg-gray-200 dark:bg-gray-700'
  },
  variants: {
    size: {
      xs: { container: 'h-1.5' },
      sm: { container: 'h-2' },
      md: { container: 'h-2.5' },
      lg: { container: 'h-3' },
      xl: { container: 'h-4' }
    },
    color: {
      primary: {
        step: 'data-[state=completed]:bg-primary-500 data-[state=completed]:dark:bg-primary-900 data-[state=current]:bg-primary-800 data-[state=current]:dark:bg-primary-400',
        glow: 'bg-primary-800 dark:bg-primary-400'
      },
      secondary: {
        step: 'data-[state=completed]:bg-secondary-500 data-[state=completed]:dark:bg-secondary-900 data-[state=current]:bg-secondary-800 data-[state=current]:dark:bg-secondary-400',
        glow: 'bg-secondary-800 dark:bg-secondary-400'
      },
      gray: {
        step: 'data-[state=completed]:bg-gray-400 data-[state=completed]:dark:bg-gray-500 data-[state=current]:bg-gray-700 data-[state=current]:dark:bg-gray-200',
        glow: 'bg-gray-700 dark:bg-gray-200'
      },
      red: {
        step: 'data-[state=completed]:bg-red-600 data-[state=completed]:dark:bg-red-900 data-[state=current]:bg-red-900 data-[state=current]:dark:bg-red-500',
        glow: 'bg-red-900 dark:bg-red-500'
      },
      yellow: {
        step: 'data-[state=completed]:bg-yellow-400 data-[state=completed]:dark:bg-yellow-600 data-[state=current]:bg-yellow-600 data-[state=current]:dark:bg-yellow-400',
        glow: 'bg-yellow-600 dark:bg-yellow-400'
      },
      green: {
        step: 'data-[state=completed]:bg-green-500 data-[state=completed]:dark:bg-green-900 data-[state=current]:bg-green-800 data-[state=current]:dark:bg-green-400',
        glow: 'bg-green-800 dark:bg-green-400'
      },
      indigo: {
        step: 'data-[state=completed]:bg-indigo-500 data-[state=completed]:dark:bg-indigo-900 data-[state=current]:bg-indigo-800 data-[state=current]:dark:bg-indigo-400',
        glow: 'bg-indigo-800 dark:bg-indigo-400'
      },
      purple: {
        step: 'data-[state=completed]:bg-purple-500 data-[state=completed]:dark:bg-purple-900 data-[state=current]:bg-purple-800 data-[state=current]:dark:bg-purple-400',
        glow: 'bg-purple-800 dark:bg-purple-400'
      },
      pink: {
        step: 'data-[state=completed]:bg-pink-500 data-[state=completed]:dark:bg-pink-900 data-[state=current]:bg-pink-800 data-[state=current]:dark:bg-pink-400',
        glow: 'bg-pink-800 dark:bg-pink-400'
      },
      blue: {
        step: 'data-[state=completed]:bg-blue-500 data-[state=completed]:dark:bg-blue-900 data-[state=current]:bg-blue-800 data-[state=current]:dark:bg-blue-400',
        glow: 'bg-blue-800 dark:bg-blue-400'
      },
      custom: {
        step: '',
        glow: ''
      }
    },
    glow: {
      true: {},
      false: {}
    },
    hideLabel: {
      true: {},
      false: {}
    }
  },
  compoundVariants: [
    {
      glow: false,
      class: {
        glow: 'hidden'
      }
    },
    {
      hideLabel: true,
      class: {
        label: 'hidden'
      }
    }
  ],
  defaultVariants: {
    size: 'md',
    color: 'primary',
    glow: false,
    hideLabel: false
  }
});
tv({
  slots: {
    base: 'flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base',
    item: 'flex items-center',
    content: 'flex items-center'
  },
  variants: {
    status: {
      completed: {
        item: "text-primary-600 dark:text-primary-500 md:w-full sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700",
        content:
          "after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500"
      },
      current: {
        item: "md:w-full sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700",
        content:
          "after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500"
      },
      pending: {
        item: "md:w-full sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700",
        content:
          "after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500"
      }
    },
    isLast: {
      true: {
        item: 'after:content-none after:hidden',
        content: 'after:content-none'
      },
      false: {}
    }
  },
  defaultVariants: {
    status: 'pending',
    isLast: false
  }
});
tv({
  slots: {
    base: 'flex items-center w-full',
    item: 'flex items-center w-full',
    circle: 'flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0'
  },
  variants: {
    status: {
      completed: {
        item: "text-primary-600 dark:text-primary-500 after:content-[''] after:w-full after:h-1 after:border-b after:border-primary-100 after:border-4 after:inline-block dark:after:border-primary-800",
        circle: 'bg-primary-100 dark:bg-primary-800'
      },
      current: {
        item: "after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-100 after:border-4 after:inline-block dark:after:border-gray-700",
        circle: 'bg-gray-100 dark:bg-gray-700'
      },
      pending: {
        item: "after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-100 after:border-4 after:inline-block dark:after:border-gray-700",
        circle: 'bg-gray-100 dark:bg-gray-700'
      }
    },
    isLast: {
      true: {
        item: 'after:content-none'
      },
      false: {}
    }
  },
  defaultVariants: {
    status: 'pending',
    isLast: false
  }
});
tv({
  slots: {
    base: 'items-center w-full space-y-4 sm:flex sm:space-x-8 sm:space-y-0 rtl:space-x-reverse',
    item: 'flex items-center space-x-2.5 rtl:space-x-reverse',
    indicator: 'flex items-center justify-center w-8 h-8 rounded-full shrink-0'
  },
  variants: {
    status: {
      completed: {
        item: 'text-primary-600 dark:text-primary-500',
        indicator:
          'border border-primary-600 dark:border-primary-500 bg-primary-600 dark:bg-primary-500 text-white'
      },
      current: {
        item: 'text-gray-500 dark:text-gray-400',
        indicator: 'border border-gray-500 dark:border-gray-400 text-gray-500 dark:text-gray-400'
      },
      pending: {
        item: 'text-gray-500 dark:text-gray-400',
        indicator: 'border border-gray-500 dark:border-gray-400 text-gray-500 dark:text-gray-400'
      }
    }
  },
  defaultVariants: {
    status: 'pending'
  }
});
tv({
  slots: {
    base: 'space-y-4 w-72',
    card: 'w-full p-4 border rounded-lg',
    content: 'flex items-center justify-between'
  },
  variants: {
    status: {
      completed: {
        card: 'text-green-700 border-green-300 bg-green-50 dark:bg-gray-800 dark:border-green-800 dark:text-green-400'
      },
      current: {
        card: 'text-primary-700 bg-primary-100 border-primary-300 dark:bg-gray-800 dark:border-primary-800 dark:text-primary-400'
      },
      pending: {
        card: 'text-gray-900 bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
      }
    }
  },
  defaultVariants: {
    status: 'pending'
  }
});
tv({
  slots: {
    base: 'flex items-center w-full p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-lg shadow-xs dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4 rtl:space-x-reverse',
    item: 'flex items-center',
    indicator: 'flex items-center justify-center w-5 h-5 me-2 text-xs rounded-full shrink-0'
  },
  variants: {
    status: {
      completed: {
        item: 'text-primary-600 dark:text-primary-500',
        indicator:
          'border border-primary-600 dark:border-primary-500 bg-primary-600 dark:bg-primary-500 text-white'
      },
      current: {
        item: 'text-gray-500 dark:text-gray-400',
        indicator: 'border border-gray-500 dark:border-gray-400 text-gray-500 dark:text-gray-400'
      },
      pending: {
        item: 'text-gray-500 dark:text-gray-400',
        indicator: 'border border-gray-500 dark:border-gray-400 text-gray-500 dark:text-gray-400'
      }
    },
    hasChevron: {
      true: {},
      false: {}
    }
  },
  defaultVariants: {
    status: 'pending',
    hasChevron: false
  }
});
tv({
  slots: {
    base: 'relative text-gray-500 border-s border-gray-200 dark:border-gray-700 dark:text-gray-400',
    item: 'ms-6',
    circle:
      'absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900'
  },
  variants: {
    status: {
      completed: {
        circle: 'bg-green-200 dark:bg-green-900'
      },
      current: {
        circle: 'bg-gray-100 dark:bg-gray-700'
      },
      pending: {
        circle: 'bg-gray-100 dark:bg-gray-700'
      }
    },
    isLast: {
      true: {},
      false: {
        item: 'mb-10'
      }
    }
  },
  defaultVariants: {
    status: 'pending',
    isLast: false
  }
});
tv({
  slots: {
    base: 'flex space-x-2 rtl:space-x-reverse',
    content: 'p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4',
    divider: 'h-px bg-gray-200 dark:bg-gray-700',
    active: 'p-4 text-primary-600 bg-gray-100 rounded-t-lg dark:bg-gray-800 dark:text-primary-500',
    inactive:
      'p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
  },
  variants: {
    tabStyle: {
      full: {
        active:
          'p-4 w-full rounded-none group-first:rounded-s-lg group-last:rounded-e-lg text-gray-900 bg-gray-100 focus:ring-4 focus:ring-primary-300 focus:outline-hidden dark:bg-gray-700 dark:text-white',
        inactive:
          'p-4 w-full rounded-none group-first:rounded-s-lg group-last:rounded-e-lg text-gray-500 dark:text-gray-400 bg-white hover:text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-primary-300 focus:outline-hidden dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700'
      },
      pill: {
        active: 'py-3 px-4 text-white bg-primary-600 rounded-lg',
        inactive:
          'py-3 px-4 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
      },
      underline: {
        base: '-mb-px',
        active:
          'p-4 text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500 bg-transparent',
        inactive:
          'p-4 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400 bg-transparent'
      },
      none: {
        active: '',
        inactive: ''
      }
    },
    hasDivider: {
      true: {}
    }
  },
  compoundVariants: [
    {
      tabStyle: ['full', 'pill'],
      hasDivider: true,
      class: {
        divider: 'hidden'
      }
    }
  ],
  defaultVariants: {
    tabStyle: 'none',
    hasDivider: true
  }
});
tv({
  slots: {
    base: 'group focus-within:z-10',
    button: 'inline-block text-sm font-medium text-center disabled:cursor-not-allowed'
  },
  variants: {
    open: {
      true: {
        button: 'active'
      }
    },
    disabled: {
      true: {
        button: 'cursor-not-allowed'
      }
    }
  },
  compoundVariants: [
    {
      open: true,
      class: {
        button: ''
        // We'll merge this with activeClasses from context
      }
    },
    {
      open: false,
      class: {
        button: ''
        // We'll merge this with inactiveClasses from context
      }
    }
  ],
  defaultVariants: {
    open: false,
    disabled: false
  }
});
tv({
  slots: {
    div: 'relative overflow-x-auto',
    table: 'w-full text-left text-sm'
  },
  variants: {
    color: {
      // default, primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      default: { table: 'text-gray-500 dark:text-gray-400' },
      primary: { table: 'text-primary-100 dark:text-primary-100' },
      secondary: { table: 'text-secondary-100 dark:text-secondary-100' },
      gray: { table: 'text-gray-100 dark:text-gray-100' },
      red: { table: 'text-red-100 dark:text-red-100' },
      orange: { table: 'text-orange-100 dark:text-orange-100' },
      amber: { table: 'text-amber-100 dark:text-amber-100' },
      yellow: { table: 'text-yellow-100 dark:text-yellow-100' },
      lime: { table: 'text-lime-100 dark:text-lime-100' },
      green: { table: 'text-green-100 dark:text-green-100' },
      emerald: { table: 'text-emerald-100 dark:text-emerald-100' },
      teal: { table: 'text-teal-100 dark:text-teal-100' },
      cyan: { table: 'text-cyan-100 dark:text-cyan-100' },
      sky: { table: 'text-sky-100 dark:text-sky-100' },
      blue: { table: 'text-blue-100 dark:text-blue-100' },
      indigo: { table: 'text-indigo-100 dark:text-indigo-100' },
      violet: { table: 'text-violet-100 dark:text-violet-100' },
      purple: { table: 'text-purple-100 dark:text-purple-100' },
      fuchsia: { table: 'text-fuchsia-100 dark:text-fuchsia-100' },
      pink: { table: 'text-pink-100 dark:text-pink-100' },
      rose: { table: 'text-rose-100 dark:text-rose-100' }
    },
    shadow: {
      true: { div: 'shadow-md sm:rounded-lg' }
    }
  }
});
tv({
  base: '',
  variants: {
    color: {
      default: 'bg-white dark:bg-gray-800 dark:border-gray-700',
      primary: 'bg-white bg-primary-500 border-primary-400',
      secondary: 'bg-white bg-secondary-500 border-secondary-400',
      gray: 'bg-gray-500 border-gray-400',
      red: 'bg-red-500 border-red-400',
      orange: 'bg-orange-500 border-orange-400',
      amber: 'bg-amber-500 border-amber-400',
      yellow: 'bg-yellow-500 border-yellow-400',
      lime: 'bg-lime-500 border-lime-400',
      green: 'bg-white bg-green-500 border-green-400',
      emerald: 'bg-emerald-500 border-emerald-400',
      teal: 'bg-teal-500 border-teal-400',
      cyan: 'bg-cyan-500 border-cyan-400',
      sky: 'bg-sky-500 border-sky-400',
      blue: 'bg-white bg-blue-500 border-blue-400',
      indigo: 'bg-indigo-500 border-indigo-400',
      violet: 'bg-violet-500 border-violet-400',
      purple: 'bg-purple-500 border-purple-400',
      fuchsia: 'bg-fuchsia-500 border-fuchsia-400',
      pink: 'bg-pink-500 border-pink-400',
      rose: 'bg-rose-500 border-rose-400'
    },
    hoverable: {
      true: ''
    },
    striped: {
      true: ''
    },
    border: {
      true: 'border-b last:border-b-0'
    }
  },
  compoundVariants: [
    {
      hoverable: true,
      color: 'default',
      class: 'hover:bg-gray-50 dark:hover:bg-gray-600'
    },
    {
      hoverable: true,
      color: 'primary',
      class: 'hover:bg-primary-400 dark:hover:bg-primary-400'
    },
    {
      hoverable: true,
      color: 'secondary',
      class: 'hover:bg-secondary-400 dark:hover:bg-secondary-400'
    },
    {
      hoverable: true,
      color: 'gray',
      class: 'hover:bg-gray-400 dark:hover:bg-gray-400'
    },
    {
      hoverable: true,
      color: 'red',
      class: 'hover:bg-red-400 dark:hover:bg-red-400'
    },
    {
      hoverable: true,
      color: 'orange',
      class: 'hover:bg-orange-400 dark:hover:bg-orange-400'
    },
    {
      hoverable: true,
      color: 'amber',
      class: 'hover:bg-amber-400 dark:hover:bg-amber-400'
    },
    {
      hoverable: true,
      color: 'yellow',
      class: 'hover:bg-yellow-400 dark:hover:bg-yellow-400'
    },
    {
      hoverable: true,
      color: 'lime',
      class: 'hover:bg-lime-400 dark:hover:bg-lime-400'
    },
    {
      hoverable: true,
      color: 'green',
      class: 'hover:bg-green-400 dark:hover:bg-green-400'
    },
    {
      hoverable: true,
      color: 'emerald',
      class: 'hover:bg-emerald-400 dark:hover:bg-emerald-400'
    },
    {
      hoverable: true,
      color: 'teal',
      class: 'hover:bg-teal-400 dark:hover:bg-teal-400'
    },
    {
      hoverable: true,
      color: 'cyan',
      class: 'hover:bg-cyan-400 dark:hover:bg-cyan-400'
    },
    {
      hoverable: true,
      color: 'sky',
      class: 'hover:bg-sky-400 dark:hover:bg-sky-400'
    },
    {
      hoverable: true,
      color: 'blue',
      class: 'hover:bg-blue-400 dark:hover:bg-blue-400'
    },
    {
      hoverable: true,
      color: 'indigo',
      class: 'hover:bg-indigo-400 dark:hover:bg-indigo-400'
    },
    {
      hoverable: true,
      color: 'violet',
      class: 'hover:bg-violet-400 dark:hover:bg-violet-400'
    },
    {
      hoverable: true,
      color: 'purple',
      class: 'hover:bg-purple-400 dark:hover:bg-purple-400'
    },
    {
      hoverable: true,
      color: 'fuchsia',
      class: 'hover:bg-fuchsia-400 dark:hover:bg-fuchsia-400'
    },
    {
      hoverable: true,
      color: 'pink',
      class: 'hover:bg-pink-400 dark:hover:bg-pink-400'
    },
    {
      hoverable: true,
      color: 'rose',
      class: 'hover:bg-rose-400 dark:hover:bg-rose-400'
    },
    {
      striped: true,
      color: 'default',
      class: 'odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700'
    },
    {
      striped: true,
      color: 'primary',
      class:
        'odd:bg-primary-500 even:bg-primary-600 dark:odd:bg-primary-500 dark:even:bg-primary-600'
    },
    {
      striped: true,
      color: 'secondary',
      class:
        'odd:bg-secondary-500 even:bg-secondary-600 dark:odd:bg-secondary-500 dark:even:bg-secondary-600'
    },
    {
      striped: true,
      color: 'gray',
      class: 'odd:bg-gray-500 even:bg-gray-600 dark:odd:bg-gray-500 dark:even:bg-gray-600'
    },
    // default, primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
    {
      striped: true,
      color: 'red',
      class: 'odd:bg-red-500 even:bg-red-600 dark:odd:bg-red-500 dark:even:bg-red-600'
    },
    {
      striped: true,
      color: 'orange',
      class: 'odd:bg-orange-500 even:bg-orange-600 dark:odd:bg-orange-500 dark:even:bg-orange-600'
    },
    {
      striped: true,
      color: 'amber',
      class: 'odd:bg-amber-500 even:bg-amber-600 dark:odd:bg-amber-500 dark:even:bg-amber-600'
    },
    {
      striped: true,
      color: 'yellow',
      class: 'odd:bg-yellow-500 even:bg-yellow-600 dark:odd:bg-yellow-500 dark:even:bg-yellow-600'
    },
    {
      striped: true,
      color: 'lime',
      class: 'odd:bg-lime-500 even:bg-lime-600 dark:odd:bg-lime-500 dark:even:bg-lime-600'
    },
    {
      striped: true,
      color: 'green',
      class: 'odd:bg-green-500 even:bg-green-600 dark:odd:bg-green-500 dark:even:bg-green-600'
    },
    {
      striped: true,
      color: 'emerald',
      class:
        'odd:bg-emerald-500 even:bg-emerald-600 dark:odd:bg-emerald-500 dark:even:bg-emerald-600'
    },
    {
      striped: true,
      color: 'teal',
      class: 'odd:bg-teal-500 even:bg-teal-600 dark:odd:bg-teal-500 dark:even:bg-teal-600'
    },
    {
      striped: true,
      color: 'cyan',
      class: 'odd:bg-cyan-500 even:bg-cyan-600 dark:odd:bg-cyan-500 dark:even:bg-cyan-600'
    },
    {
      striped: true,
      color: 'sky',
      class: 'odd:bg-sky-500 even:bg-sky-600 dark:odd:bg-sky-500 dark:even:bg-sky-600'
    },
    {
      striped: true,
      color: 'blue',
      class: 'odd:bg-blue-500 even:bg-blue-600 dark:odd:bg-blue-500 dark:even:bg-blue-600'
    },
    {
      striped: true,
      color: 'indigo',
      class: 'odd:bg-indigo-500 even:bg-indigo-600 dark:odd:bg-indigo-500 dark:even:bg-indigo-600'
    },
    {
      striped: true,
      color: 'violet',
      class: 'odd:bg-violet-500 even:bg-violet-600 dark:odd:bg-violet-500 dark:even:bg-violet-600'
    },
    {
      striped: true,
      color: 'purple',
      class: 'odd:bg-purple-500 even:bg-purple-600 dark:odd:bg-purple-500 dark:even:bg-purple-600'
    },
    {
      striped: true,
      color: 'fuchsia',
      class:
        'odd:bg-fuchsia-500 even:bg-fuchsia-600 dark:odd:bg-fuchsia-500 dark:even:bg-fuchsia-600'
    },
    {
      striped: true,
      color: 'pink',
      class: 'odd:bg-pink-500 even:bg-pink-600 dark:odd:bg-pink-500 dark:even:bg-pink-600'
    },
    {
      striped: true,
      color: 'rose',
      class: 'odd:bg-rose-500 even:bg-rose-600 dark:odd:bg-rose-500 dark:even:bg-rose-600'
    }
  ]
});
tv({
  base: 'text-xs uppercase',
  variants: {
    color: {
      // default, primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      default: 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-700',
      primary: 'text-white dark:text-white bg-primary-700 dark:bg-primary-700',
      secondary: 'text-white dark:text-white bg-secondary-700 dark:bg-secondary-700',
      gray: 'text-white dark:text-white bg-gray-700 dark:bg-gray-700',
      red: 'text-white dark:text-white bg-red-700 dark:bg-red-700',
      orange: 'text-white dark:text-white bg-orange-700 dark:bg-orange-700',
      amber: 'text-white dark:text-white bg-amber-700 dark:bg-amber-700',
      yellow: 'text-white dark:text-white bg-yellow-700 dark:bg-yellow-700',
      lime: 'text-white dark:text-white bg-lime-700 dark:bg-lime-700',
      green: 'text-white dark:text-white bg-green-700 dark:bg-green-700',
      emerald: 'text-white dark:text-white bg-emerald-700 dark:bg-emerald-700',
      teal: 'text-white dark:text-white bg-teal-700 dark:bg-teal-700',
      cyan: 'text-white dark:text-white bg-cyan-700 dark:bg-cyan-700',
      sky: 'text-white dark:text-white bg-sky-700 dark:bg-sky-700',
      blue: 'text-white dark:text-white bg-blue-700 dark:bg-blue-700',
      indigo: 'text-white dark:text-white bg-indigo-700 dark:bg-indigo-700',
      violet: 'text-white dark:text-white bg-violet-700 dark:bg-violet-700',
      purple: 'text-white dark:text-white bg-purple-700 dark:bg-purple-700',
      fuchsia: 'text-white dark:text-white bg-fuchsia-700 dark:bg-fuchsia-700',
      pink: 'text-white dark:text-white bg-pink-700 dark:bg-pink-700',
      rose: 'text-white dark:text-white bg-rose-700 dark:bg-rose-700'
    },
    border: {
      true: '',
      false: ''
    },
    striped: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [
    {
      color: 'default',
      border: true,
      class: ''
      //"bg-transparent dark:bg-transparent"
    },
    {
      color: 'default',
      striped: true,
      class: ''
      //"bg-transparent dark:bg-transparent border-gray-700"
    },
    {
      striped: true,
      color: 'blue',
      class: 'border-blue-400'
    },
    {
      striped: true,
      color: 'green',
      class: 'border-green-400'
    },
    {
      striped: true,
      color: 'red',
      class: 'border-red-400'
    },
    {
      striped: true,
      color: 'yellow',
      class: 'border-yellow-400'
    },
    {
      striped: true,
      color: 'purple',
      class: 'border-purple-400'
    },
    {
      striped: true,
      color: 'indigo',
      class: 'border-indigo-400'
    },
    {
      striped: true,
      color: 'pink',
      class: 'border-pink-400'
    }
  ]
});
tv({
  base: 'px-6 py-4 whitespace-nowrap font-medium'
});
tv({
  base: 'px-6 py-3'
});
tv({
  slots: {
    root: 'relative overflow-x-auto shadow-md sm:rounded-lg',
    inner: 'p-4',
    search: 'relative mt-1',
    svgDiv: 'absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none',
    svg: 'w-5 h-5',
    input:
      'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 p-2.5 ps-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
    table: 'w-full text-left text-sm'
  },
  variants: {
    color: {
      default: {
        svg: 'text-gray-500 dark:text-gray-400',
        table: 'text-gray-500 dark:text-gray-400'
      },
      blue: {
        svg: 'text-blue-500 dark:text-blue-400',
        table: 'text-blue-100 dark:text-blue-100'
      },
      green: {
        svg: 'text-green-500 dark:text-green-400',
        table: 'text-green-100 dark:text-green-100'
      },
      red: {
        svg: 'text-red-500 dark:text-red-400',
        table: 'text-red-100 dark:text-red-100'
      },
      yellow: {
        svg: 'text-yellow-500 dark:text-yellow-400',
        table: 'text-yellow-100 dark:text-yellow-100'
      },
      purple: {
        svg: 'text-purple-500 dark:text-purple-400',
        table: 'text-purple-100 dark:text-purple-100'
      },
      indigo: {
        svg: 'text-indigo-500 dark:text-indigo-400',
        table: 'text-indigo-100 dark:text-indigo-100'
      },
      pink: {
        svg: 'text-pink-500 dark:text-pink-400',
        table: 'text-pink-100 dark:text-pink-100'
      }
    },
    striped: {
      true: {
        table:
          '[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(odd)]:dark:bg-gray-900 [&_tbody_tr:nth-child(even)]:bg-gray-50 [&_tbody_tr:nth-child(even)]:dark:bg-gray-800'
      },
      false: {}
    },
    hoverable: {
      true: {
        table: '[&_tbody_tr]:hover:bg-gray-50 [&_tbody_tr]:dark:hover:bg-gray-600'
      },
      false: {}
    }
  },
  defaultVariants: {
    color: 'default',
    striped: false,
    hoverable: false
  }
});
tv({
  base: 'relative border-s border-gray-200 dark:border-gray-700'
});
tv({
  slots: {
    li: 'mb-10 ms-6',
    span: 'flex absolute -start-3 justify-center items-center w-6 h-6 bg-blue-200 rounded-full ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900',
    img: 'rounded-full shadow-lg',
    outer:
      'p-4 bg-white rounded-lg border border-gray-200 shadow-xs dark:bg-gray-700 dark:border-gray-600',
    inner: 'justify-between items-center mb-3 sm:flex',
    time: 'mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0',
    title: 'text-sm font-normal text-gray-500 lex dark:text-gray-300',
    text: 'p-3 text-xs italic font-normal text-gray-500 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300'
  }
});
tv({
  slots: {
    div: 'p-5 mb-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700',
    time: 'text-lg font-semibold text-gray-900 dark:text-white',
    ol: 'mt-3 divide-y divider-gray-200 dark:divide-gray-700'
  }
});
tv({
  slots: {
    base: '',
    a: 'block items-center p-3 sm:flex hover:bg-gray-100 dark:hover:bg-gray-700',
    img: 'me-3 mb-3 w-12 h-12 rounded-full sm:mb-0',
    div: 'text-gray-600 dark:text-gray-400',
    title: 'text-base font-normal',
    span: 'inline-flex items-center text-xs font-normal text-gray-500 dark:text-gray-400',
    svg: 'me-1 h-3 w-3'
  }
});
const colorVariants = {
  primary: {
    dot: 'bg-primary-200 dark:bg-primary-900',
    ring: 'ring-white dark:ring-gray-900',
    icon: 'text-primary-600 dark:text-primary-400'
  },
  green: {
    dot: 'bg-green-200 dark:bg-green-900',
    ring: 'ring-white dark:ring-gray-900',
    icon: 'text-green-600 dark:text-green-400'
  },
  orange: {
    dot: 'bg-orange-200 dark:bg-orange-900',
    ring: 'ring-white dark:ring-gray-900',
    icon: 'text-orange-600 dark:text-orange-400'
  },
  red: {
    dot: 'bg-red-200 dark:bg-red-900',
    ring: 'ring-white dark:ring-gray-900',
    icon: 'text-red-600 dark:text-red-400'
  },
  blue: {
    dot: 'bg-blue-200 dark:bg-blue-900',
    ring: 'ring-white dark:ring-gray-900',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  purple: {
    dot: 'bg-purple-200 dark:bg-purple-900',
    ring: 'ring-white dark:ring-gray-900',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  gray: {
    dot: 'bg-gray-200 dark:bg-gray-700',
    ring: 'ring-white dark:ring-gray-900',
    icon: 'text-gray-600 dark:text-gray-400'
  }
};
tv({
  variants: {
    order: {
      group:
        'p-5 mb-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700',
      horizontal: 'sm:flex',
      activity: 'relative',
      vertical: 'relative',
      default: 'relative border-s border-gray-200 dark:border-gray-700'
    }
  },
  defaultVariants: {
    order: 'default'
  }
});
tv({
  slots: {
    base: 'relative',
    div: '',
    time: '',
    h3: '',
    svg: 'w-4 h-4',
    connector: 'absolute top-6 left-3 w-px h-full'
  },
  variants: {
    order: {
      default: {
        base: 'mb-10 ms-4',
        div: 'absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700',
        time: 'mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500',
        h3: 'text-lg font-semibold text-gray-900 dark:text-white'
      },
      vertical: {
        base: 'mb-10 ms-6 relative',
        div: 'flex absolute -left-4 top-1.5 justify-center items-center w-6 h-6 rounded-full ring-8',
        time: 'mb-1 pl-4 text-sm font-normal leading-none text-gray-400 dark:text-gray-500',
        h3: 'flex ml-4 items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white',
        connector: 'absolute top-7 -left-1.5 w-px h-full'
      },
      horizontal: {
        base: 'relative mb-6 sm:mb-0',
        div: 'flex items-center',
        time: 'mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500',
        h3: 'text-lg font-semibold text-gray-900 dark:text-white'
      },
      activity: {
        base: 'mb-10 ms-6 relative',
        div: 'flex absolute -left-4 top-1.5 justify-center items-center w-6 h-6 rounded-full ring-8',
        time: 'mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500',
        h3: 'text-lg font-semibold text-gray-900 dark:text-white',
        connector: 'absolute top-7 -left-4 w-px h-full'
      },
      group: {
        base: '',
        div: 'p-5 mb-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700',
        time: 'text-lg font-semibold text-gray-900 dark:text-white',
        h3: 'text-lg font-semibold text-gray-900 dark:text-white'
      }
    },
    color: {
      primary: {},
      green: {},
      orange: {},
      red: {},
      blue: {},
      purple: {},
      gray: {}
    },
    isLast: {
      true: {},
      false: {}
    }
  },
  compoundVariants: [
    // Vertical color variants
    {
      order: 'vertical',
      color: 'primary',
      class: {
        div: colorVariants.primary.dot + ' ' + colorVariants.primary.ring,
        svg: colorVariants.primary.icon,
        connector: 'bg-primary-200 dark:bg-primary-700'
      }
    },
    {
      order: 'vertical',
      color: 'green',
      class: {
        div: colorVariants.green.dot + ' ' + colorVariants.green.ring,
        svg: colorVariants.green.icon,
        connector: 'bg-green-200 dark:bg-green-700'
      }
    },
    {
      order: 'vertical',
      color: 'orange',
      class: {
        div: colorVariants.orange.dot + ' ' + colorVariants.orange.ring,
        svg: colorVariants.orange.icon,
        connector: 'bg-orange-200 dark:bg-orange-700'
      }
    },
    {
      order: 'vertical',
      color: 'red',
      class: {
        div: colorVariants.red.dot + ' ' + colorVariants.red.ring,
        svg: colorVariants.red.icon,
        connector: 'bg-red-200 dark:bg-red-700'
      }
    },
    {
      order: 'vertical',
      color: 'blue',
      class: {
        div: colorVariants.blue.dot + ' ' + colorVariants.blue.ring,
        svg: colorVariants.blue.icon,
        connector: 'bg-blue-200 dark:bg-blue-700'
      }
    },
    {
      order: 'vertical',
      color: 'purple',
      class: {
        div: colorVariants.purple.dot + ' ' + colorVariants.purple.ring,
        svg: colorVariants.purple.icon,
        connector: 'bg-purple-200 dark:bg-purple-700'
      }
    },
    {
      order: 'vertical',
      color: 'gray',
      class: {
        div: colorVariants.gray.dot + ' ' + colorVariants.gray.ring,
        svg: colorVariants.gray.icon,
        connector: 'bg-gray-200 dark:bg-gray-700'
      }
    },
    // Horizontal color variants
    {
      order: 'horizontal',
      color: 'primary',
      class: {
        div: colorVariants.primary.dot + ' ' + colorVariants.primary.ring,
        svg: colorVariants.primary.icon
      }
    },
    {
      order: 'horizontal',
      color: 'green',
      class: {
        div: colorVariants.green.dot + ' ' + colorVariants.green.ring,
        svg: colorVariants.green.icon
      }
    },
    {
      order: 'horizontal',
      color: 'orange',
      class: {
        div: colorVariants.orange.dot + ' ' + colorVariants.orange.ring,
        svg: colorVariants.orange.icon
      }
    },
    {
      order: 'horizontal',
      color: 'red',
      class: {
        div: colorVariants.red.dot + ' ' + colorVariants.red.ring,
        svg: colorVariants.red.icon
      }
    },
    {
      order: 'horizontal',
      color: 'blue',
      class: {
        div: colorVariants.blue.dot + ' ' + colorVariants.blue.ring,
        svg: colorVariants.blue.icon
      }
    },
    {
      order: 'horizontal',
      color: 'purple',
      class: {
        div: colorVariants.purple.dot + ' ' + colorVariants.purple.ring,
        svg: colorVariants.purple.icon
      }
    },
    {
      order: 'horizontal',
      color: 'gray',
      class: {
        div: colorVariants.gray.dot + ' ' + colorVariants.gray.ring,
        svg: colorVariants.gray.icon
      }
    },
    // Hide connector on last item
    {
      isLast: true,
      class: {
        connector: 'hidden'
      }
    }
  ],
  defaultVariants: {
    order: 'default',
    color: 'primary',
    isLast: false
  }
});
tv({
  slots: {
    base: 'flex w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800 gap-3',
    icon: 'w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg',
    content: 'w-full text-sm font-normal',
    close:
      'ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700'
  },
  variants: {
    position: {
      'top-left': { base: 'absolute top-5 start-5' },
      'top-right': { base: 'absolute top-5 end-5' },
      'bottom-left': { base: 'absolute bottom-5 start-5' },
      'bottom-right': { base: 'absolute bottom-5 end-5' }
    },
    color: {
      // primary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: {
        icon: 'text-primary-500 bg-primary-100 dark:bg-primary-800 dark:text-primary-200',
        close:
          'text-primary-500 dark:text-primary-200 hover:text-primary-600 dark:hover:text-primary-500'
      },
      gray: {
        icon: 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-200',
        close: 'text-gray-500 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-500'
      },
      red: {
        icon: 'text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200',
        close: 'text-red-500 dark:text-red-200 hover:text-red-600 dark:hover:text-red-500'
      },
      orange: {
        icon: 'text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200',
        close:
          'text-orange-500 dark:text-orange-200 hover:text-orange-600 dark:hover:text-orange-500'
      },
      amber: {
        icon: 'text-amber-500 bg-amber-100 dark:bg-amber-700 dark:text-amber-200',
        close: 'text-amber-500 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-500'
      },
      yellow: {
        icon: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-800 dark:text-yellow-200',
        close:
          'text-yellow-500 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-500'
      },
      lime: {
        icon: 'text-lime-500 bg-lime-100 dark:bg-lime-700 dark:text-lime-200',
        close: 'text-lime-500 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-500'
      },
      green: {
        icon: 'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200',
        close: 'text-green-500 dark:text-green-200 hover:text-green-600 dark:hover:text-green-500'
      },
      emerald: {
        icon: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-800 dark:text-emerald-200',
        close:
          'text-emerald-500 dark:text-emerald-200 hover:text-emerald-600 dark:hover:text-emerald-500'
      },
      teal: {
        icon: 'text-teal-500 bg-teal-100 dark:bg-teal-800 dark:text-teal-200',
        close: 'text-teal-500 dark:text-teal-200 hover:text-teal-600 dark:hover:text-teal-500'
      },
      cyan: {
        icon: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-800 dark:text-cyan-200',
        close: 'text-cyan-500 dark:text-cyan-200 hover:text-cyan-600 dark:hover:text-cyan-500'
      },
      sky: {
        icon: 'text-sky-500 bg-sky-100 dark:bg-sky-800 dark:text-sky-200',
        close: 'text-sky-500 dark:text-sky-200 hover:text-sky-600 dark:hover:text-sky-500'
      },
      blue: {
        icon: 'text-blue-500 bg-blue-100 dark:bg-blue-800 dark:text-blue-200',
        close: 'text-blue-500 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-500'
      },
      indigo: {
        icon: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-800 dark:text-indigo-200',
        close:
          'text-indigo-500 dark:text-indigo-200 hover:text-indigo-600 dark:hover:text-indigo-500'
      },
      violet: {
        icon: 'text-violet-500 bg-violet-100 dark:bg-violet-800 dark:text-violet-200',
        close:
          'text-violet-500 dark:text-violet-200 hover:text-violet-600 dark:hover:text-violet-500'
      },
      purple: {
        icon: 'text-purple-500 bg-purple-100 dark:bg-purple-800 dark:text-purple-200',
        close:
          'text-purple-500 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-500'
      },
      fuchsia: {
        icon: 'text-fuchsia-500 bg-fuchsia-100 dark:bg-fuchsia-800 dark:text-fuchsia-200',
        close:
          'text-fuchsia-500 dark:text-fuchsia-200 hover:text-fuchsia-600 dark:hover:text-fuchsia-500'
      },
      pink: {
        icon: 'text-pink-500 bg-pink-100 dark:bg-pink-700 dark:text-pink-200',
        close: 'text-pink-500 dark:text-pink-200 hover:text-pink-600 dark:hover:text-pink-500'
      },
      rose: {
        icon: 'text-rose-500 bg-rose-100 dark:bg-rose-700 dark:text-rose-200',
        close: 'text-rose-500 dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500'
      }
    },
    align: {
      true: { base: 'items-center' },
      false: { base: 'items-start' }
    }
  }
});
tv({
  base: 'fixed z-50 space-y-3'
});
tv({
  base: 'inline-flex border border-gray-300 overflow-hidden',
  variants: {
    roundedSize: {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }
  }
});
tv({
  slots: {
    button:
      'relative flex items-center transition-all duration-200 focus:outline-none border-r last:border-r-0 dark:bg-white dark:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50',
    content: 'flex items-center w-full overflow-hidden relative',
    text: 'transition-all duration-200 ml-0',
    icon: 'absolute left-0 flex-shrink-0 text-green-600'
  },
  variants: {
    selected: {
      true: {
        text: 'ml-5'
      },
      false: {}
    },
    size: {
      sm: {
        button: 'p-1 px-2 text-sm'
      },
      md: {
        button: 'p-2 px-4 text-base'
      },
      lg: {
        button: 'p-3 px-5 text-lg'
      },
      xl: {
        button: 'p-4 px-6 text-xl'
      }
    },
    roundedSize: {
      sm: {
        button: 'first:rounded-s-sm last:rounded-e-sm'
      },
      md: {
        button: 'first:rounded-s-md last:rounded-e-md'
      },
      lg: {
        button: 'first:rounded-s-lg last:rounded-e-lg'
      },
      xl: {
        button: 'first:rounded-s-xl last:rounded-e-xl'
      },
      full: {
        button: 'first:rounded-s-full last:rounded-e-full'
      }
    },
    color: {
      primary: {
        button: 'data-[selected=true]:bg-primary-200 data-[selected=false]:hover:bg-gray-100'
      },
      secondary: {
        button: 'data-[selected=true]:bg-secondary-200 data-[selected=false]:hover:bg-gray-100'
      },
      gray: {
        button: 'data-[selected=true]:bg-gray-200 data-[selected=false]:hover:bg-gray-100'
      },
      red: {
        button: 'data-[selected=true]:bg-red-200 data-[selected=false]:hover:bg-red-50'
      },
      orange: {
        button: 'data-[selected=true]:bg-orange-200 data-[selected=false]:hover:bg-orange-50'
      },
      amber: {
        button: 'data-[selected=true]:bg-amber-200 data-[selected=false]:hover:bg-amber-50'
      },
      yellow: {
        button: 'data-[selected=true]:bg-yellow-200 data-[selected=false]:hover:bg-yellow-50'
      },
      lime: {
        button: 'data-[selected=true]:bg-lime-200 data-[selected=false]:hover:bg-lime-50'
      },
      green: {
        button: 'data-[selected=true]:bg-green-200 data-[selected=false]:hover:bg-green-50'
      },
      emerald: {
        button: 'data-[selected=true]:bg-emerald-200 data-[selected=false]:hover:bg-emerald-50'
      },
      teal: {
        button: 'data-[selected=true]:bg-teal-200 data-[selected=false]:hover:bg-teal-50'
      },
      cyan: {
        button: 'data-[selected=true]:bg-cyan-200 data-[selected=false]:hover:bg-cyan-50'
      },
      sky: {
        button: 'data-[selected=true]:bg-sky-200 data-[selected=false]:hover:bg-sky-50'
      },
      blue: {
        button: 'data-[selected=true]:bg-blue-200 data-[selected=false]:hover:bg-blue-50'
      },
      indigo: {
        button: 'data-[selected=true]:bg-indigo-200 data-[selected=false]:hover:bg-indigo-50'
      },
      violet: {
        button: 'data-[selected=true]:bg-violet-200 data-[selected=false]:hover:bg-violet-50'
      },
      purple: {
        button: 'data-[selected=true]:bg-purple-200 data-[selected=false]:hover:bg-purple-50'
      },
      fuchsia: {
        button: 'data-[selected=true]:bg-fuchsia-200 data-[selected=false]:hover:bg-fuchsia-50'
      },
      pink: {
        button: 'data-[selected=true]:bg-pink-200 data-[selected=false]:hover:bg-pink-50'
      },
      rose: {
        button: 'data-[selected=true]:bg-rose-200 data-[selected=false]:hover:bg-rose-50'
      },
      none: {}
    }
  },
  defaultVariants: {
    selected: false,
    color: 'primary',
    size: 'md',
    roundedSize: 'md'
  }
});
tv({
  slots: {
    base: 'w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 me-2 rounded-sm',
    div: 'flex items-center'
  },
  variants: {
    color: {
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: {
        base: 'text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600'
      },
      secondary: {
        base: 'text-secondary-600 focus:ring-secondary-500 dark:focus:ring-secondary-600'
      },
      gray: {
        base: 'text-gray-600 focus:ring-gray-600 dark:ring-offset-gray-800 dark:focus:ring-gray-600'
      },
      red: {
        base: 'text-red-600 focus:ring-red-600 dark:ring-offset-red-600 dark:focus:ring-red-600'
      },
      orange: {
        base: 'text-orange-600 focus:ring-orange-600 dark:ring-offset-orange-600 dark:focus:ring-orange-600'
      },
      amber: {
        base: 'text-amber-600 focus:ring-amber-600 dark:ring-offset-amber-600 dark:focus:ring-amber-600'
      },
      yellow: {
        base: 'text-yellow-400 focus:ring-yellow-400 dark:ring-offset-yellow-400 dark:focus:ring-yellow-400'
      },
      lime: {
        base: 'text-lime-700 focus:ring-lime-700 dark:ring-offset-lime-700 dark:focus:ring-lime-700'
      },
      green: {
        base: 'text-green-600 focus:ring-green-600 dark:ring-offset-green-600 dark:focus:ring-green-600'
      },
      emerald: {
        base: 'text-emerald-600 focus:ring-emerald-600 dark:ring-offset-emerald-600 dark:focus:ring-emerald-600'
      },
      teal: {
        base: 'text-teal-600 focus:ring-teal-600 dark:ring-offset-teal-600 dark:focus:ring-teal-600'
      },
      cyan: {
        base: 'text-cyan-600 focus:ring-cyan-600 dark:ring-offset-cyan-600 dark:focus:ring-cyan-600'
      },
      sky: {
        base: 'text-sky-600 focus:ring-sky-600 dark:ring-offset-sky-600 dark:focus:ring-sky-600'
      },
      blue: {
        base: 'text-blue-700 focus:ring-blue-600 dark:ring-offset-blue-700 dark:focus:ring-blue-700'
      },
      indigo: {
        base: 'text-indigo-700 focus:ring-indigo-700 dark:ring-offset-indigo-700 dark:focus:ring-indigo-700'
      },
      violet: {
        base: 'text-violet-600 focus:ring-violet-600 dark:ring-offset-violet-600 dark:focus:ring-violet-600'
      },
      purple: {
        base: 'text-purple-600 focus:ring-purple-600 dark:ring-offset-purple-600 dark:focus:ring-purple-600'
      },
      fuchsia: {
        base: 'text-fuchsia-600 focus:ring-fuchsia-600 dark:ring-offset-fuchsia-600 dark:focus:ring-fuchsia-600'
      },
      pink: {
        base: 'text-pink-600 focus:ring-pink-600 dark:ring-offset-pink-600 dark:focus:ring-pink-600'
      },
      rose: {
        base: 'text-rose-600 focus:ring-rose-600 dark:ring-offset-rose-600 dark:focus:ring-rose-600'
      }
    },
    tinted: {
      true: { base: 'dark:bg-gray-600 dark:border-gray-500' },
      false: { base: 'dark:bg-gray-700 dark:border-gray-600' }
    },
    custom: {
      true: { base: 'sr-only peer' }
    },
    rounded: {
      true: { base: 'rounded-sm' }
    },
    inline: {
      true: {
        div: 'inline-flex',
        false: 'flex items-center'
      }
    },
    disabled: {
      true: {
        base: 'cursor-not-allowed opacity-50 bg-gray-200 border-gray-300',
        div: 'cursor-not-allowed opacity-70'
      },
      false: {}
    }
  },
  defaultVariants: {
    color: 'primary',
    disabled: false
  }
});
tv({
  base: '',
  variants: {
    inline: {
      true: 'inline-flex',
      false: 'flex'
    },
    checked: {
      true: 'outline-4 outline-green-500'
    }
  },
  defaultVariants: {
    inline: true
  }
});
const label = tv({
  base: 'text-sm rtl:text-right font-medium block',
  variants: {
    color: {
      disabled: 'text-gray-500 dark:text-gray-500',
      primary: 'text-primary-700 dark:text-primary-500',
      secondary: 'text-secondary-700 dark:text-secondary-500',
      green: 'text-green-700 dark:text-green-500',
      emerald: 'text-emerald-700 dark:text-emerald-500',
      red: 'text-red-700 dark:text-red-500',
      blue: 'text-blue-700 dark:text-blue-500',
      yellow: 'text-yellow-700 dark:text-yellow-500',
      orange: 'text-orange-700 dark:text-orange-500',
      gray: 'text-gray-700 dark:text-gray-200',
      teal: 'text-teal-700 dark:text-teal-500',
      cyan: 'text-cyan-700 dark:text-cyan-500',
      sky: 'text-sky-700 dark:text-sky-500',
      indigo: 'text-indigo-700 dark:text-indigo-500',
      lime: 'text-lime-700 dark:text-lime-500',
      amber: 'text-amber-700 dark:text-amber-500',
      violet: 'text-violet-700 dark:text-violet-500',
      purple: 'text-purple-700 dark:text-purple-500',
      fuchsia: 'text-fuchsia-700 dark:text-fuchsia-500',
      pink: 'text-pink-700 dark:text-pink-500',
      rose: 'text-rose-700 dark:text-rose-500'
    }
  }
});
function Label($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      color = 'gray',
      show = true,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const theme = getTheme('label');
    let base = label({ color, class: clsx(theme, className) });
    if (show) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<label${attributes({ ...restProps, class: clsx$1(base) })}>`);
      children($$renderer2);
      $$renderer2.push(`<!----></label>`);
    } else {
      $$renderer2.push('<!--[!-->');
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
const dropzone = tv({
  base: 'flex flex-col justify-center items-center w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'
});
function Dropzone($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      files = void 0,
      class: className,
      onDrop,
      onDragOver,
      onChange,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const theme = getTheme('dropzone');
    $$renderer2.push(`<label${attr_class(clsx$1(dropzone({ class: clsx(theme, className) })))}>`);
    children($$renderer2);
    $$renderer2.push(
      `<!----> <input${attributes({ ...restProps, type: 'file', class: 'hidden' }, void 0, void 0, void 0, 4)}/></label>`
    );
    bind_props($$props, { files });
  });
}
tv({
  slots: {
    base: 'block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 text-sm rounded-lg border p-0! dark:text-gray-400',
    wrapper: 'relative w-full',
    close: 'flex absolute inset-y-0 items-center text-gray-500 dark:text-gray-400 end-0 p-2.5',
    svg: ''
  },
  variants: {
    size: {
      sm: { base: 'text-xs ps-9 pe-9 p-2' },
      md: { base: 'text-sm ps-10 pe-10 p-2.5' },
      lg: { base: 'sm:text-base ps-11 pe-11 p-3' }
    }
  }
});
tv({
  slots: {
    base: 'relative',
    input:
      'block w-full text-sm text-gray-900 bg-transparent appearance-none dark:text-white focus:outline-hidden focus:ring-0 peer disabled:cursor-not-allowed disabled:opacity-50',
    label:
      'absolute text-sm duration-300 transform scale-75 z-10 origin-left rtl:origin-right peer-placeholder-shown:scale-100 peer-focus:scale-75',
    close: 'absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black',
    combo:
      'absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800',
    svg: ''
  },
  variants: {
    variant: {
      filled: {
        base: 'relative',
        input: 'rounded-t-lg border-0 border-b-2 bg-gray-50 dark:bg-gray-700',
        label:
          '-translate-y-4 start-2.5 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-4'
      },
      outlined: {
        base: 'relative',
        input: 'rounded-lg border',
        label:
          '-translate-y-4 bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:-translate-y-4 start-1'
      },
      standard: {
        base: 'relative z-0',
        input: 'border-0 border-b-2',
        label:
          '-translate-y-6 -z-10 peer-focus:start-0 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-6'
      }
    },
    size: {
      small: {},
      default: {}
    },
    color: {
      default: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-primary-500 focus:border-primary-600',
        label:
          'text-gray-500 dark:text-gray-400 peer-focus:text-primary-600 dark:peer-focus:text-primary-500'
      },
      primary: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-primary-500 focus:border-primary-600',
        label:
          'text-primary-500 dark:text-primary-400 peer-focus:text-primary-600 dark:peer-focus:text-primary-500'
      },
      secondary: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-secondary-500 focus:border-secondary-600',
        label:
          'text-secondary-500 dark:text-secondary-400 peer-focus:text-secondary-600 dark:peer-focus:text-secondary-500'
      },
      gray: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-gray-500 focus:border-gray-600',
        label:
          'text-gray-500 dark:text-gray-400 peer-focus:text-gray-600 dark:peer-focus:text-gray-500'
      },
      red: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-red-500 focus:border-red-600',
        label: 'text-red-500 dark:text-red-400 peer-focus:text-red-600 dark:peer-focus:text-red-500'
      },
      orange: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-orange-500 focus:border-orange-600',
        label:
          'text-orange-500 dark:text-orange-400 peer-focus:text-orange-600 dark:peer-focus:text-orange-500'
      },
      amber: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-amber-500 focus:border-amber-600',
        label:
          'text-amber-500 dark:text-amber-400 peer-focus:text-amber-600 dark:peer-focus:text-amber-500'
      },
      yellow: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-yellow-500 focus:border-yellow-600',
        label:
          'text-yellow-500 dark:text-yellow-400 peer-focus:text-yellow-600 dark:peer-focus:text-yellow-500'
      },
      lime: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-lime-500 focus:border-lime-600',
        label:
          'text-lime-500 dark:text-lime-400 peer-focus:text-lime-600 dark:peer-focus:text-lime-500'
      },
      green: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-green-500 focus:border-green-600',
        label:
          'text-green-500 dark:text-green-400 peer-focus:text-green-600 dark:peer-focus:text-green-500'
      },
      emerald: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-emerald-500 focus:border-emerald-600',
        label:
          'text-emerald-500 dark:text-emerald-400 peer-focus:text-emerald-600 dark:peer-focus:text-emerald-500'
      },
      teal: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-teal-500 focus:border-teal-600',
        label:
          'text-teal-500 dark:text-teal-400 peer-focus:text-teal-600 dark:peer-focus:text-teal-500'
      },
      cyan: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-cyan-500 focus:border-cyan-600',
        label:
          'text-cyan-500 dark:text-cyan-400 peer-focus:text-cyan-600 dark:peer-focus:text-cyan-500'
      },
      sky: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-sky-500 focus:border-sky-600',
        label: 'text-sky-500 dark:text-sky-400 peer-focus:text-sky-600 dark:peer-focus:text-sky-500'
      },
      blue: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-blue-500 focus:border-blue-600',
        label:
          'text-blue-500 dark:text-blue-400 peer-focus:text-blue-600 dark:peer-focus:text-blue-500'
      },
      indigo: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-indigo-500 focus:border-indigo-600',
        label:
          'text-indigo-500 dark:text-indigo-400 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-500'
      },
      violet: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-violet-500 focus:border-violet-600',
        label:
          'text-violet-600 dark:text-violet-500 peer-focus:text-violet-600 dark:peer-focus:text-violet-500'
      },
      purple: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-purple-500 focus:border-purple-600',
        label:
          'text-purple-600 dark:text-purple-500 peer-focus:text-purple-600 dark:peer-focus:text-purple-500'
      },
      fuchsia: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-fuchsia-500 focus:border-fuchsia-600',
        label:
          'text-fuchsia-600 dark:text-fuchsia-500 peer-focus:text-fuchsia-600 dark:peer-focus:text-fuchsia-500'
      },
      pink: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-pink-500 focus:border-pink-600',
        label:
          'text-pink-600 dark:text-pink-500 peer-focus:text-pink-600 dark:peer-focus:text-pink-500'
      },
      rose: {
        input:
          'border-gray-300 dark:border-gray-600 dark:focus:border-rose-500 focus:border-rose-600',
        label:
          'text-rose-600 dark:text-rose-500 peer-focus:text-rose-600 dark:peer-focus:text-rose-500'
      }
    }
  },
  compoundVariants: [
    {
      variant: 'filled',
      size: 'small',
      class: {
        input: 'px-2.5 pb-1.5 pt-4',
        label: 'top-3'
      }
    },
    {
      variant: 'filled',
      size: 'default',
      class: {
        input: 'px-2.5 pb-2.5 pt-5',
        label: 'top-4'
      }
    },
    {
      variant: 'outlined',
      size: 'small',
      class: {
        input: 'px-2.5 pb-1.5 pt-3',
        label: 'top-1'
      }
    },
    {
      variant: 'outlined',
      size: 'default',
      class: {
        input: 'px-2.5 pb-2.5 pt-4',
        label: 'top-2'
      }
    },
    {
      variant: 'standard',
      size: 'small',
      class: {
        input: 'py-2 px-0',
        label: 'top-3'
      }
    },
    {
      variant: 'standard',
      size: 'default',
      class: {
        input: 'py-2.5 px-0',
        label: 'top-3'
      }
    },
    {
      variant: 'filled',
      color: 'primary',
      class: {
        input: 'dark:focus:border-primary-500 focus:border-primary-600'
      }
    }
  ],
  defaultVariants: {
    variant: 'standard',
    size: 'default',
    color: 'primary'
  }
});
tv({
  base: 'text-xs font-normal text-gray-500 dark:text-gray-300',
  variants: {
    color: {
      disabled: 'text-gray-400 dark:text-gray-500',
      primary: 'text-primary-500 dark:text-primary-400',
      secondary: 'text-secondary-500 dark:text-secondary-400',
      green: 'text-green-500 dark:text-green-400',
      emerald: 'text-emerald-500 dark:text-emerald-400',
      red: 'text-red-500 dark:text-red-400',
      blue: 'text-blue-500 dark:text-blue-400',
      yellow: 'text-yellow-500 dark:text-yellow-400',
      orange: 'text-orange-500 dark:text-orange-400',
      gray: 'text-gray-500 dark:text-gray-400',
      teal: 'text-teal-500 dark:text-teal-400',
      cyan: 'text-cyan-500 dark:text-cyan-400',
      sky: 'text-sky-500 dark:text-sky-400',
      indigo: 'text-indigo-500 dark:text-indigo-400',
      lime: 'text-lime-500 dark:text-lime-400',
      amber: 'text-amber-500 dark:text-amber-400',
      violet: 'text-violet-500 dark:text-violet-400',
      purple: 'text-purple-500 dark:text-purple-400',
      fuchsia: 'text-fuchsia-500 dark:text-fuchsia-400',
      pink: 'text-pink-500 dark:text-pink-400',
      rose: 'text-rose-500 dark:text-rose-400'
    }
  }
});
tv({
  slots: {
    base: 'relative w-full',
    input:
      'block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right focus:outline-hidden',
    left: 'flex absolute inset-y-0 items-center text-gray-500 dark:text-gray-400 pointer-events-none start-0 p-2.5',
    right: 'flex absolute inset-y-0 items-center text-gray-500 dark:text-gray-400 end-0 p-2.5',
    close: 'absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black',
    combo:
      'absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800',
    comboItem: 'text-gray-900 dark:text-gray-50',
    div: '',
    svg: ''
  },
  variants: {
    size: {
      sm: { input: 'text-xs px-2 py-1' },
      md: { input: 'text-sm px-2.5 py-2.5' },
      lg: { input: 'sm:text-base px-3 py-3' }
    },
    color: {
      default: {
        input:
          'border border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
      },
      tinted: {
        input:
          'border border-gray-300 dark:border-gray-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400'
      },
      primary: {
        input:
          'border border-primary-200 dark:border-primary-400 focus:ring-primary-500 focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500 bg-primary-50 text-primary-900 placeholder-primary-700 dark:text-primary-400 dark:placeholder-primary-500 dark:bg-gray-700'
      },
      secondary: {
        input:
          'border border-secondary-200 dark:border-secondary-400 focus:ring-secondary-500 focus:border-secondary-600 dark:focus:ring-secondary-500 dark:focus:border-secondary-500 bg-secondary-50 text-secondary-900 placeholder-secondary-700 dark:text-secondary-400 dark:placeholder-secondary-500 dark:bg-gray-700'
      },
      green: {
        input:
          'border border-green-200 dark:border-green-400 focus:ring-green-500 focus:border-green-600 dark:focus:ring-green-500 dark:focus:border-green-500 bg-green-50 text-green-900 placeholder-green-700 dark:text-green-400 dark:placeholder-green-500 dark:bg-gray-700'
      },
      emerald: {
        input:
          'border border-emerald-200 dark:border-emerald-400 focus:ring-emerald-500 focus:border-emerald-600 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-emerald-50 text-emerald-900 placeholder-emerald-700 dark:text-emerald-400 dark:placeholder-emerald-500 dark:bg-gray-700'
      },
      red: {
        input:
          'border border-red-200 dark:border-red-400 focus:ring-red-500 focus:border-red-600 dark:focus:ring-red-500 dark:focus:border-red-500 bg-red-50 text-red-900 placeholder-red-700 dark:text-red-400 dark:placeholder-red-500 dark:bg-gray-700'
      },
      blue: {
        input:
          'border border-blue-200 dark:border-blue-400 focus:ring-blue-500 focus:border-blue-600 dark:focus:ring-blue-500 dark:focus:border-blue-500 bg-blue-50 text-blue-900 placeholder-blue-700 dark:text-blue-400 dark:placeholder-blue-500 dark:bg-gray-700'
      },
      yellow: {
        input:
          'border border-yellow-200 dark:border-yellow-400 focus:ring-yellow-500 focus:border-yellow-600 dark:focus:ring-yellow-500 dark:focus:border-yellow-500 bg-yellow-50 text-yellow-900 placeholder-yellow-700 dark:text-yellow-400 dark:placeholder-yellow-500 dark:bg-gray-700'
      },
      orange: {
        input:
          'border border-orange-200 dark:border-orange-400 focus:ring-orange-500 focus:border-orange-600 dark:focus:ring-orange-500 dark:focus:border-orange-500 bg-orange-50 text-orange-900 placeholder-orange-700 dark:text-orange-400 dark:placeholder-orange-500 dark:bg-gray-700'
      },
      gray: {
        input:
          'border border-gray-200 dark:border-gray-400 focus:ring-gray-500 focus:border-gray-600 dark:focus:ring-gray-500 dark:focus:border-gray-500 bg-gray-50 text-gray-900 placeholder-gray-700 dark:text-gray-400 dark:placeholder-gray-500 dark:bg-gray-700'
      },
      teal: {
        input:
          'border border-teal-200 dark:border-teal-400 focus:ring-teal-500 focus:border-teal-600 dark:focus:ring-teal-500 dark:focus:border-teal-500 bg-teal-50 text-teal-900 placeholder-teal-700 dark:text-teal-400 dark:placeholder-teal-500 dark:bg-gray-700'
      },
      cyan: {
        input:
          'border border-cyan-200 dark:border-cyan-400 focus:ring-cyan-500 focus:border-cyan-600 dark:focus:ring-cyan-500 dark:focus:border-cyan-500 bg-cyan-50 text-cyan-900 placeholder-cyan-700 dark:text-cyan-400 dark:placeholder-cyan-500 dark:bg-gray-700'
      },
      sky: {
        input:
          'border border-sky-200 dark:border-sky-400 focus:ring-sky-500 focus:border-sky-600 dark:focus:ring-sky-500 dark:focus:border-sky-500 bg-sky-50 text-sky-900 placeholder-sky-700 dark:text-sky-400 dark:placeholder-sky-500 dark:bg-gray-700'
      },
      indigo: {
        input:
          'border border-indigo-200 dark:border-indigo-400 focus:ring-indigo-500 focus:border-indigo-600 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 bg-indigo-50 text-indigo-900 placeholder-indigo-700 dark:text-indigo-400 dark:placeholder-indigo-500 dark:bg-gray-700'
      },
      lime: {
        input:
          'border border-lime-200 dark:border-lime-400 focus:ring-lime-500 focus:border-lime-600 dark:focus:ring-lime-500 dark:focus:border-lime-500 bg-lime-50 text-lime-900 placeholder-lime-700 dark:text-lime-400 dark:placeholder-lime-500 dark:bg-gray-700'
      },
      amber: {
        input:
          'border border-amber-200 dark:border-amber-400 focus:ring-amber-500 focus:border-amber-600 dark:focus:ring-amber-500 dark:focus:border-amber-500 bg-amber-50 text-amber-900 placeholder-amber-700 dark:text-amber-400 dark:placeholder-amber-500 dark:bg-gray-700'
      },
      violet: {
        input:
          'border border-violet-200 dark:border-violet-400 focus:ring-violet-500 focus:border-violet-600 dark:focus:ring-violet-500 dark:focus:border-violet-500 bg-violet-50 text-violet-900 placeholder-violet-700 dark:text-violet-400 dark:placeholder-violet-500 dark:bg-gray-700'
      },
      purple: {
        input:
          'border border-purple-200 dark:border-purple-400 focus:ring-purple-500 focus:border-purple-600 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-purple-50 text-purple-900 placeholder-purple-700 dark:text-purple-400 dark:placeholder-purple-500 dark:bg-gray-700'
      },
      fuchsia: {
        input:
          'border border-fuchsia-200 dark:border-fuchsia-400 focus:ring-fuchsia-500 focus:border-fuchsia-600 dark:focus:ring-fuchsia-500 dark:focus:border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900 placeholder-fuchsia-700 dark:text-fuchsia-400 dark:placeholder-fuchsia-500 dark:bg-gray-700'
      },
      pink: {
        input:
          'border border-pink-200 dark:border-pink-400 focus:ring-pink-500 focus:border-pink-600 dark:focus:ring-pink-500 dark:focus:border-pink-500 bg-pink-50 text-pink-900 placeholder-pink-700 dark:text-pink-400 dark:placeholder-pink-500 dark:bg-gray-700'
      },
      rose: {
        input:
          'border border-rose-200 dark:border-rose-400 focus:ring-rose-500 focus:border-rose-600 dark:focus:ring-rose-500 dark:focus:border-rose-500 bg-rose-50 text-rose-900 placeholder-rose-700 dark:text-rose-400 dark:placeholder-rose-500 dark:bg-gray-700'
      }
    },
    grouped: {
      false: { base: 'rounded-lg', input: 'rounded-lg' },
      true: {
        base: 'first:rounded-s-lg last:rounded-e-lg not-first:-ms-px group',
        input: 'group-first:rounded-s-lg group-last:rounded-e-lg group-not-first:-ms-px h-full'
      }
    }
  },
  defaultVariants: {
    size: 'md',
    color: 'default'
  }
});
tv({
  slots: {
    div: 'absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none',
    svg: 'w-4 h-4 text-gray-500 dark:text-gray-400',
    input:
      'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
    span: 'absolute start-0 bottom-3 text-gray-500 dark:text-gray-400',
    floatingInput:
      'block py-2.5 ps-6 pe-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-primary-500 focus:outline-none focus:ring-0 focus:border-primary-600 peer disabled:cursor-not-allowed disabled:opacity-50',
    label:
      'absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 origin-[0] peer-placeholder-shown:start-6 peer-focus:start-0 peer-focus:text-primary-600 peer-focus:dark:text-primary-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto'
  },
  variants: {
    phoneType: {
      default: {},
      floating: {
        svg: 'w-4 h-4 rtl:rotate-[270deg]'
      },
      countryCode: {
        input: 'rounded-none rounded-e-lg'
      },
      copy: {},
      advanced: {}
    },
    phoneIcon: {
      true: { input: 'ps-10' },
      false: {}
    }
  }
});
tv({
  slots: {
    base: 'relative w-full',
    select: 'block w-full rtl:text-right',
    close: 'absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black',
    svg: ''
  },
  variants: {
    underline: {
      true: {
        select:
          'text-gray-500 bg-transparent rounded-none! border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-hidden focus:ring-0 focus:border-gray-200 peer px-0!'
      },
      false: {
        select:
          'text-gray-900 bg-gray-50 border border-gray-300 focus:outline-hidden focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
      }
    },
    size: {
      sm: { select: 'text-xs px-2.5 py-2.5' },
      md: { select: 'text-sm px-2.5 py-2.5' },
      lg: { select: 'text-base py-3 px-4' }
    },
    disabled: {
      true: {
        select: 'cursor-not-allowed opacity-50'
      },
      false: {}
    },
    grouped: {
      false: { base: 'rounded-lg', select: 'rounded-lg' },
      true: {
        base: 'first:rounded-s-lg last:rounded-e-lg not-first:-ms-px group',
        select: 'group-first:rounded-s-lg group-last:rounded-e-lg group-not-first:-ms-px h-full'
      }
    }
  },
  defaultVariants: {
    underline: false,
    size: 'md'
  }
});
tv({
  slots: {
    base: 'relative border border-gray-300 w-full flex items-center gap-2 dark:border-gray-600 ring-primary-500 dark:ring-primary-500 focus-visible:outline-hidden',
    select: '',
    dropdown:
      'absolute z-50 p-3 flex flex-col gap-1 max-h-64 bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 start-0 top-[calc(100%+1rem)] rounded-lg cursor-pointer overflow-y-scroll w-full',
    item: 'py-2 px-3 rounded-lg text-gray-600 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-600',
    close: 'p-0 focus:ring-gray-400 dark:text-white',
    span: '',
    placeholder: 'text-gray-400',
    svg: 'ms-1 h-3 w-3 cursor-pointer text-gray-800 dark:text-white'
  },
  variants: {
    size: {
      sm: 'px-2.5 py-2.5 min-h-[2.4rem] text-xs',
      md: 'px-2.5 py-2.5 min-h-[2.7rem] text-sm',
      lg: 'px-3 py-3 min-h-[3.2rem] sm:text-base'
    },
    disabled: {
      true: {
        base: 'cursor-not-allowed opacity-50 pointer-events-none',
        item: 'cursor-not-allowed opacity-50',
        close: 'cursor-not-allowed'
      },
      false: {
        base: 'focus-within:border-primary-500 dark:focus-within:border-primary-500 focus-within:ring-1'
      }
    },
    active: {
      true: {
        item: 'bg-primary-100 text-primary-500 dark:bg-primary-500 dark:text-primary-100 hover:bg-primary-100 dark:hover:bg-primary-500 hover:text-primary-600 dark:hover:text-primary-100'
      }
    },
    selected: {
      true: {
        item: 'bg-gray-100 text-black font-semibold hover:text-black dark:text-white dark:bg-gray-600 dark:hover:text-white'
      }
    },
    grouped: {
      false: { base: 'rounded-lg', select: 'rounded-lg' },
      true: {
        base: 'first:rounded-s-lg last:rounded-e-lg not-first:-ms-px group',
        select: 'group-first:rounded-s-lg group-last:rounded-e-lg group-not-first:-ms-px h-full'
      }
    }
  },
  // Add compoundVariants here
  compoundVariants: [
    {
      selected: true,
      active: true,
      class: {
        item: 'bg-primary-200 dark:bg-primary-600 text-primary-700 dark:text-primary-100 font-semibold'
        // Adjust colors as needed
      }
    }
  ],
  defaultVariants: {
    underline: false,
    size: 'md'
  }
});
tv({
  slots: {
    input:
      'flex items-center w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 mr-2',
    label: 'flex items-center'
  },
  variants: {
    color: {
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: {
        input: 'text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600'
      },
      secondary: {
        input: 'text-secondary-600 focus:ring-secondary-500 dark:focus:ring-secondary-600'
      },
      gray: {
        input: 'text-gray-600 focus:ring-gray-500 dark:focus:ring-gray-600'
      },
      red: { input: 'text-red-600 focus:ring-red-500 dark:focus:ring-red-600' },
      orange: {
        input: 'text-orange-500 focus:ring-orange-500 dark:focus:ring-orange-600'
      },
      amber: {
        input: 'text-amber-600 focus:ring-amber-500 dark:focus:ring-amber-600'
      },
      yellow: {
        input: 'text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-600'
      },
      lime: {
        input: 'text-lime-600 focus:ring-lime-500 dark:focus:ring-lime-600'
      },
      green: {
        input: 'text-green-600 focus:ring-green-500 dark:focus:ring-green-600'
      },
      emerald: {
        input: 'text-emerald-600 focus:ring-emerald-500 dark:focus:ring-emerald-600'
      },
      teal: {
        input: 'text-teal-600 focus:ring-teal-500 dark:focus:ring-teal-600'
      },
      cyan: {
        input: 'text-cyan-600 focus:ring-cyan-500 dark:focus:ring-cyan-600'
      },
      sky: { input: 'text-sky-600 focus:ring-sky-500 dark:focus:ring-sky-600' },
      blue: {
        input: 'text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600'
      },
      indigo: {
        input: 'text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600'
      },
      violet: {
        input: 'text-violet-600 focus:ring-violet-500 dark:focus:ring-violet-600'
      },
      purple: {
        input: 'text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-600'
      },
      fuchsia: {
        input: 'text-fuchsia-600 focus:ring-fuchsia-500 dark:focus:ring-fuchsia-600'
      },
      pink: {
        input: 'text-pink-600 focus:ring-pink-500 dark:focus:ring-pink-600'
      },
      rose: {
        input: 'text-rose-600 focus:ring-rose-500 dark:focus:ring-rose-600'
      }
    },
    tinted: {
      true: { input: 'dark:bg-gray-600 dark:border-gray-500' },
      false: { input: 'dark:bg-gray-700 dark:border-gray-600' }
    },
    custom: {
      true: { input: 'sr-only peer' },
      false: { input: 'relative' }
    },
    inline: {
      true: { label: 'inline-flex' },
      false: { label: 'flex' }
    }
  },
  defaultVariants: {
    color: 'primary'
  }
});
tv({
  base: '',
  variants: {
    inline: {
      true: 'inline-flex',
      false: 'flex'
    }
  },
  defaultVariants: {
    inline: true
  }
});
tv({
  base: 'w-full bg-gray-200 rounded-lg cursor-pointer dark:bg-gray-700',
  variants: {
    size: {
      sm: 'h-1 range-sm',
      md: 'h-2',
      lg: 'h-3 range-lg'
    },
    color: {
      // other colors do not work
      gray: '',
      red: '',
      blue: '',
      indigo: '',
      violet: '',
      purple: '',
      fuchsia: '',
      pink: '',
      rose: ''
    },
    appearance: {
      auto: 'range accent-red-500',
      none: 'appearance-none'
    }
  },
  compoundVariants: [
    {
      appearance: 'auto',
      color: 'gray',
      class: 'accent-gray-500'
    },
    {
      appearance: 'auto',
      color: 'red',
      class: 'accent-red-500'
    },
    {
      appearance: 'auto',
      color: 'blue',
      class: 'accent-blue-500'
    },
    {
      appearance: 'auto',
      color: 'indigo',
      class: 'accent-indigo-500'
    },
    {
      appearance: 'auto',
      color: 'violet',
      class: 'accent-violet-500'
    },
    {
      appearance: 'auto',
      color: 'purple',
      class: 'accent-purple-500'
    },
    {
      appearance: 'auto',
      color: 'fuchsia',
      class: 'accent-fuchsia-500'
    },
    {
      appearance: 'auto',
      color: 'pink',
      class: 'accent-pink-500'
    },
    {
      appearance: 'auto',
      color: 'rose',
      class: 'accent-rose-500'
    }
  ]
});
tv({
  slots: {
    base: 'relative w-full',
    left: 'absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none',
    icon: 'text-gray-500 dark:text-gray-400',
    content: 'absolute inset-y-0 end-0 flex items-center text-gray-500 dark:text-gray-400',
    input:
      'block w-full text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
    close: 'absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black',
    svg: ''
  },
  variants: {
    size: {
      sm: {
        input: 'text-xs p-2 ps-9 pe-9 ',
        icon: 'w-3 h-3'
        // leftDiv: 'ps-2.5',
      },
      md: {
        input: 'text-sm p-2.5 ps-10 pe-10',
        icon: 'w-4 h-4'
        // leftDiv: 'ps-10',
      },
      lg: {
        input: 'sm:text-base p-3 ps-11 pe-11',
        icon: 'w-6 h-6'
        // leftDiv: 'ps-11',
      }
    }
  },
  defaultVariants: {
    size: 'lg'
  }
});
tv({
  base: 'text-gray-900 dark:text-white',
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
      '7xl': 'text-7xl',
      '8xl': 'text-8xl',
      '9xl': 'text-9xl'
    },
    weight: {
      thin: 'font-thin',
      extralight: 'font-extralight',
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
      black: 'font-black'
    },
    space: {
      tighter: 'tracking-tighter',
      tight: 'tracking-tight',
      normal: 'tracking-normal',
      wide: 'tracking-wide',
      wider: 'tracking-wider',
      widest: 'tracking-widest'
    },
    height: {
      none: 'leading-none',
      tight: 'leading-tight',
      snug: 'leading-snug',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
      loose: 'leading-loose',
      3: 'leading-3',
      4: 'leading-4',
      5: 'leading-5',
      6: 'leading-6',
      7: 'leading-7',
      8: 'leading-8',
      9: 'leading-9',
      10: 'leading-10'
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    },
    whitespace: {
      normal: 'whitespace-normal',
      nowrap: 'whitespace-nowrap',
      pre: 'whitespace-pre',
      preline: 'whitespace-pre-line',
      prewrap: 'whitespace-pre-wrap'
    },
    italic: {
      true: 'italic'
    },
    firstUpper: {
      true: 'first-line:uppercase first-line:tracking-widest first-letter:text-7xl first-letter:font-bold first-letter:text-gray-900 dark:first-letter:text-gray-100 first-letter:me-3 first-letter:float-left',
      false: ''
    },
    justify: {
      true: 'text-justify',
      false: ''
    }
  }
});
tv({
  slots: {
    base: 'border border-gray-300 dark:border-gray-600 rounded-lg flex focus-within:ring-primary-500 focus-within:ring-1 focus-within:border-primary-500 scrollbar-hidden bg-gray-50 dark:bg-gray-700',
    tag: 'flex items-center rounded-lg bg-gray-100 text-gray-900 border border-gray-300 my-1 ml-1 px-2 text-sm max-w-full min-w-fit',
    span: 'items-center',
    close: 'my-auto ml-1',
    input:
      'block text-sm m-2.5 p-0 bg-transparent border-none outline-none text-gray-900 h-min w-full min-w-fit focus:ring-0 placeholder-gray-400 dark:text-white disabled:cursor-not-allowed disabled:opacity-50',
    info: 'mt-1 text-sm text-blue-500 dark:text-blue-400',
    warning: 'mt-1 text-sm text-yellow-400 dark:text-yellow-300',
    error: 'mt-1 text-sm text-red-500 dark:text-red-400'
  }
});
tv({
  slots: {
    div: 'relative',
    base: 'block w-full text-sm border-0 px-0 bg-inherit dark:bg-inherit focus:outline-hidden focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
    wrapper:
      'text-sm rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:placeholder-gray-400 dark:text-white border border-gray-200 dark:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
    inner: 'py-2 px-4 bg-white dark:bg-gray-800',
    header: 'py-2 px-3 border-gray-200 dark:border-gray-500',
    footer: 'py-2 px-3 border-gray-200 dark:border-gray-500',
    addon: 'absolute top-2 right-2 z-10',
    close: 'absolute right-2 top-5 -translate-y-1/2 text-gray-400 hover:text-black',
    svg: ''
  },
  variants: {
    wrapped: {
      false: {
        wrapper:
          'p-2.5 text-sm focus:outline-hidden focus:ring-primary-500 border-gray-300 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50'
      }
    },
    hasHeader: {
      true: {
        header: 'border-b'
      },
      false: {
        inner: 'rounded-t-lg'
      }
    },
    hasFooter: {
      true: {
        footer: 'border-t'
      },
      false: {
        inner: 'rounded-b-lg'
      }
    }
  }
});
tv({
  slots: {
    span: "me-3 shrink-0 bg-gray-200 rounded-full peer-focus:ring-4 peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all dark:bg-gray-600 dark:border-gray-500 relative ",
    label: 'flex items-center',
    input:
      'w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 rounded-sm dark:bg-gray-700 dark:border-gray-600 sr-only peer'
  },
  variants: {
    disabled: {
      true: { label: 'cursor-not-allowed opacity-50' }
    },
    checked: {
      true: '',
      false: ''
    },
    off_state_label: {
      true: { span: 'ms-3' }
    },
    color: {
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: {
        span: 'peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600'
      },
      secondary: {
        span: 'peer-focus:ring-secondary-300 dark:peer-focus:ring-secondary-800 peer-checked:bg-secondary-600'
      },
      gray: {
        span: 'peer-focus:ring-gray-300 dark:peer-focus:ring-gray-800 peer-checked:bg-gray-500'
      },
      red: {
        span: 'peer-focus:ring-red-300 dark:peer-focus:ring-red-800 peer-checked:bg-red-600'
      },
      orange: {
        span: 'peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 peer-checked:bg-orange-500'
      },
      amber: {
        span: 'peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 peer-checked:bg-amber-600'
      },
      yellow: {
        span: 'peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 peer-checked:bg-yellow-400'
      },
      lime: {
        span: 'peer-focus:ring-lime-300 dark:peer-focus:ring-lime-800 peer-checked:bg-lime-500'
      },
      green: {
        span: 'peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:bg-green-600'
      },
      emerald: {
        span: 'peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 peer-checked:bg-emerald-600'
      },
      teal: {
        span: 'peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:bg-teal-600'
      },
      cyan: {
        span: 'peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 peer-checked:bg-cyan-600'
      },
      sky: {
        span: 'peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 peer-checked:bg-sky-600'
      },
      blue: {
        span: 'peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600'
      },
      indigo: {
        span: 'peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 peer-checked:bg-indigo-600'
      },
      violet: {
        span: 'peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 peer-checked:bg-violet-600'
      },
      purple: {
        span: 'peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 peer-checked:bg-purple-600'
      },
      fuchsia: {
        span: 'peer-focus:ring-fuchsia-300 dark:peer-focus:ring-fuchsia-800 peer-checked:bg-fuchsia-600'
      },
      pink: {
        span: 'peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 peer-checked:bg-pink-600'
      },
      rose: {
        span: 'peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 peer-checked:bg-rose-600'
      }
    },
    size: {
      small: {
        span: 'w-9 h-5 after:top-[2px] after:start-[2px] after:h-4 after:w-4'
      },
      default: {
        span: 'w-11 h-6 after:top-0.5 after:start-[2px] after:h-5 after:w-5'
      },
      large: {
        span: 'w-14 h-7 after:top-0.5 after:start-[4px]  after:h-6 after:w-6'
      }
    }
  },
  defaultVariants: {
    color: 'primary'
  }
});
tv({
  slots: {
    buttonGroup: 'inline-flex rounded-lg shadow-sm relative',
    input:
      'block disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right focus:ring-0 focus:outline-none',
    inputWithIcon: 'relative px-2 pr-8',
    iconWrapper: 'pointer-events-none absolute inset-y-0 end-0 top-0 flex items-center pe-3.5',
    icon: 'h-4 w-4 text-gray-500 dark:text-gray-400',
    select:
      'text-gray-900 disabled:text-gray-400 bg-gray-50 border border-gray-300 focus:ring-0 focus:outline-none block w-full border-l-1 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:disabled:text-gray-500 dark:focus:ring-primary-500 dark:focus:border-primary-500',
    button: '!rounded-r-lg',
    buttonIcon: 'ml-2 h-4 w-4',
    rangeSeparator: 'flex items-center justify-center px-2 text-gray-500 dark:text-gray-400',
    rangeInputWrapper: 'relative',
    rangeInput: 'relative pr-8',
    rangeButton:
      'pointer-events-none absolute inset-y-0 top-0 right-0 flex items-center border-0 bg-transparent pe-3.5',
    dropdownContent: 'p-4 last:rounded-r-lg',
    dropdownInner: 'flex flex-col space-y-4',
    dropdownTimeRow: 'flex space-x-4',
    dropdownTimeCol: 'flex flex-col',
    dropdownTimeInput: 'w-24 rounded-l-lg !border-r px-2',
    dropdownButton: 'w-full !rounded-l-lg',
    toggleWrapper: 'flex w-full flex-col space-y-2',
    toggleRow: 'flex items-center justify-between',
    toggleTimeRow: 'flex space-x-4 p-2.5',
    toggleTimeCol: 'flex flex-col',
    toggleTimeInput: 'w-24 rounded-lg !border-r px-2',
    inlineGrid: 'grid w-full gap-2',
    inlineButton: 'rounded-lg'
  },
  variants: {
    type: {
      default: {
        input: 'rounded-e-lg'
      },
      select: {
        input: 'w-1/3 rounded-l-lg rounded-e-none',
        select: 'rounded-r-lg rounded-l-none'
      },
      dropdown: {
        input: 'rounded-l-lg rounded-e-none'
      },
      range: {},
      'timerange-dropdown': {},
      'timerange-toggle': {},
      'inline-buttons': {}
    },
    columns: {
      1: {
        inlineGrid: 'grid-cols-1'
      },
      2: {
        inlineGrid: 'grid-cols-2'
      },
      3: {
        inlineGrid: 'grid-cols-3'
      },
      4: {
        inlineGrid: 'grid-cols-4'
      }
    },
    disabled: {
      true: {
        input: 'disabled:cursor-not-allowed disabled:opacity-50'
      }
    }
  },
  defaultVariants: {
    type: 'default',
    columns: 2,
    disabled: false
  }
});
tv({
  base: 'inline-flex items-center hover:underline',
  variants: {
    color: {
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: 'text-primary-600 dark:text-primary-500',
      secondary: 'text-secondary-600 dark:text-secondary-500',
      gray: 'text-gray-600 dark:text-gray-500',
      red: 'text-red-600 dark:text-red-500',
      orange: 'text-orange-600 dark:text-orange-500',
      amber: 'text-amber-600 dark:text-amber-500',
      yellow: 'text-yellow-600 dark:text-yellow-500',
      lime: 'text-lime-600 dark:text-lime-500',
      green: 'text-green-600 dark:text-green-500',
      emerald: 'text-emerald-600 dark:text-emerald-500',
      teal: 'text-teal-600 dark:text-teal-500',
      cyan: 'text-cyan-600 dark:text-cyan-500',
      sky: 'text-sky-600 dark:text-sky-500',
      blue: 'text-blue-600 dark:text-blue-500',
      indigo: 'text-indigo-600 dark:text-indigo-500',
      violet: 'text-violet-600 dark:text-violet-500',
      purple: 'text-purple-600 dark:text-purple-500',
      fuchsia: 'text-fuchsia-600 dark:text-fuchsia-500',
      pink: 'text-pink-600 dark:text-pink-500',
      rose: 'text-rose-600 dark:text-rose-500'
    }
  }
});
tv({
  base: 'font-semibold text-gray-900 dark:text-white',
  variants: {
    border: {
      true: 'border-s-4 border-gray-300 dark:border-gray-500',
      false: ''
    },
    italic: {
      true: 'italic',
      false: ''
    },
    bg: {
      true: 'bg-gray-50 dark:bg-gray-800',
      false: ''
    },
    alignment: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
      '7xl': 'text-7xl',
      '8xl': 'text-8xl',
      '9xl': 'text-9xl'
    }
  },
  defaultVariants: {
    border: false,
    italic: true,
    bg: false,
    alignment: 'left',
    size: 'lg'
  }
});
tv({
  variants: {
    tag: {
      dt: 'text-gray-500 md:text-lg dark:text-gray-400',
      dd: 'text-lg font-semibold'
    }
  },
  defaultVariants: {
    tag: 'dt'
  }
});
tv({
  base: 'font-bold text-gray-900 dark:text-white',
  variants: {
    tag: {
      h1: 'text-5xl font-extrabold',
      h2: 'text-4xl',
      h3: 'text-3xl',
      h4: 'text-2xl',
      h5: 'text-xl',
      h6: 'text-lg'
    }
  },
  defaultVariants: {
    tag: 'h1'
  }
});
tv({
  slots: {
    base: 'h-px my-8 border-0',
    div: 'inline-flex items-center justify-center w-full',
    content:
      'absolute px-4 -translate-x-1/2 rtl:translate-x-1/2 bg-white start-1/2 dark:bg-gray-900',
    bg: ''
  },
  variants: {
    withChildren: {
      true: {
        base: 'w-full',
        div: 'relative'
      }
    }
  },
  defaultVariants: {
    withChildren: false
  }
});
tv({
  slots: {
    base: 'max-w-full h-auto',
    figure: '',
    caption: 'mt-2 text-sm text-center text-gray-500 dark:text-gray-400'
  },
  variants: {
    size: {
      xs: { base: 'max-w-xs', figure: 'max-w-xs' },
      sm: { base: 'max-w-sm', figure: 'max-w-sm' },
      md: { base: 'max-w-md', figure: 'max-w-md' },
      lg: { base: 'max-w-lg', figure: 'max-w-lg' },
      xl: { base: 'max-w-xl', figure: 'max-w-xl' },
      '2xl': { base: 'max-w-2xl', figure: 'max-w-2xl' },
      full: { base: 'max-w-full', figure: 'max-w-full' }
    },
    effect: {
      grayscale: {
        base: 'cursor-pointer rounded-lg grayscale filter transition-all duration-300 hover:grayscale-0'
      },
      blur: { base: 'blur-xs transition-all duration-300 hover:blur-none' },
      invert: {
        base: 'invert filter transition-all duration-300 hover:invert-0'
      },
      sepia: {
        base: 'sepia filter transition-all duration-300 hover:sepia-0'
      },
      saturate: {
        base: 'saturate-50 filter transition-all duration-300 hover:saturate-100'
      },
      'hue-rotate': {
        base: 'hue-rotate-60 filter transition-all duration-300 hover:hue-rotate-0'
      }
    },
    align: {
      left: { base: 'mx-0', figure: 'mx-0' },
      center: { base: 'mx-auto', figure: 'mx-auto' },
      right: { base: 'ml-auto mr-0', figure: 'ml-auto mr-0' }
    }
  }
});
tv({
  base: 'grid grid-cols-1 sm:grid-cols-2'
});
tv({
  base: '',
  variants: {
    tag: {
      ul: 'list-disc',
      dl: 'list-none',
      ol: 'list-decimal'
    },
    position: {
      inside: 'list-inside',
      outside: 'list-outside'
    }
  },
  defaultVariants: {
    position: 'inside',
    tag: 'ul'
  }
});
tv({
  base: 'text-white dark:bg-blue-500 bg-blue-600 px-2 rounded-sm'
});
tv({
  base: 'text-gray-500 dark:text-gray-400 font-semibold'
});
tv({
  variants: {
    italic: {
      true: 'italic'
    },
    underline: {
      true: 'underline decoration-2 decoration-blue-400 dark:decoration-blue-600'
    },
    linethrough: {
      true: 'line-through'
    },
    uppercase: {
      true: 'uppercase'
    },
    gradient: {
      skyToEmerald: 'text-transparent bg-clip-text bg-linear-to-r to-emerald-600 from-sky-400',
      purpleToBlue: 'text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-blue-500',
      pinkToOrange: 'text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-orange-400',
      tealToLime: 'text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-lime-300',
      redToYellow: 'text-transparent bg-clip-text bg-linear-to-r from-red-600 to-yellow-500',
      indigoToCyan: 'text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-cyan-400',
      fuchsiaToRose: 'text-transparent bg-clip-text bg-linear-to-r from-fuchsia-500 to-rose-500',
      amberToEmerald: 'text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-emerald-500',
      violetToRed: 'text-transparent bg-clip-text bg-linear-to-r from-violet-600 to-red-500',
      blueToGreen:
        'text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-teal-500 to-green-400',
      orangeToPurple:
        'text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-pink-500 to-purple-500',
      yellowToRed:
        'text-transparent bg-clip-text bg-linear-to-r from-yellow-200 via-indigo-400 to-red-600',
      none: ''
    },
    highlight: {
      blue: 'text-blue-600 dark:text-blue-500',
      green: 'text-green-600 dark:text-green-500',
      red: 'text-red-600 dark:text-red-500',
      yellow: 'text-yellow-600 dark:text-yellow-500',
      purple: 'text-purple-600 dark:text-purple-500',
      pink: 'text-pink-600 dark:text-pink-500',
      indigo: 'text-indigo-600 dark:text-indigo-500',
      teal: 'text-teal-600 dark:text-teal-500',
      orange: 'text-orange-600 dark:text-orange-500',
      cyan: 'text-cyan-600 dark:text-cyan-500',
      fuchsia: 'text-fuchsia-600 dark:text-fuchsia-500',
      amber: 'text-amber-600 dark:text-amber-500',
      lime: 'text-lime-600 dark:text-lime-500',
      none: ''
    },
    decoration: {
      solid: 'underline decoratio-solid',
      double: 'underline decoration-double',
      dotted: 'underline decoration-dotted',
      dashed: 'underline decoration-dashed',
      wavy: 'underline decoration-wavy',
      none: 'decoration-none'
    },
    decorationColor: {
      // blue, green, red, yellow, purple, pink, indigo, teal, orange, cyan, fuchsia, amber, lime, none
      // radio
      // primary, secondary, gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
      primary: 'underline decoration-primary-400 dark:decoration-primary-600',
      secondary: 'underline decoration-secondary-400 dark:decoration-secondary-600',
      gray: 'underline decoration-gray-400 dark:decoration-gray-600',
      orange: 'underline decoration-orange-400 dark:decoration-orange-600',
      red: 'underline decoration-red-400 dark:decoration-red-600',
      yellow: 'underline decoration-yellow-400 dark:decoration-yellow-600',
      lime: 'underline decoration-lime-400 dark:decoration-lime-600',
      green: 'underline decoration-green-400 dark:decoration-green-600',
      emerald: 'underline decoration-emerald-400 dark:decoration-emerald-600',
      teal: 'underline decoration-teal-400 dark:decoration-teal-600',
      cyan: 'underline decoration-cyan-400 dark:decoration-cyan-600',
      sky: 'underline decoration-sky-400 dark:decoration-sky-600',
      blue: 'underline decoration-blue-400 dark:decoration-blue-600',
      indigo: 'underline decoration-indigo-400 dark:decoration-indigo-600',
      violet: 'underline decoration-violet-400 dark:decoration-violet-600',
      purple: 'underline decoration-purple-400 dark:decoration-purple-600',
      fuchsia: 'underline decoration-fuchsia-400 dark:decoration-fuchsia-600',
      pink: 'underline decoration-pink-400 dark:decoration-pink-600',
      rose: 'underline decoration-rose-400 dark:decoration-rose-600',
      none: 'decoration-none'
    },
    decorationThickness: {
      1: 'underline decoration-1',
      2: 'underline decoration-2',
      4: 'underline decoration-4',
      8: 'underline decoration-8',
      0: 'decoration-0'
    }
  }
});
tv({
  slots: {
    base: 'relative max-w-2xl mx-auto p-4 space-y-4',
    // Input section
    inputSection: 'space-y-2',
    inputWrapper: 'flex gap-2',
    input:
      'flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white',
    // Search section
    searchWrapper: 'flex gap-2',
    searchContainer: 'relative flex-1',
    searchInput:
      'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white',
    searchIcon: 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400',
    // Items list
    itemsList: 'space-y-2 max-h-[500px] overflow-y-auto',
    // Empty state
    emptyState: 'text-center py-8',
    emptyIcon: 'w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3',
    emptyText: 'text-sm text-gray-500 dark:text-gray-400',
    emptySubtext: 'text-xs text-gray-400 dark:text-gray-500 mt-1',
    // Item
    item: 'group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/50',
    itemContent: 'flex-1 min-w-0',
    itemHeader: 'flex items-center gap-2 mb-1',
    itemTimestamp: 'text-xs text-gray-500 dark:text-gray-400',
    itemText: 'text-sm text-gray-900 dark:text-gray-100 break-words line-clamp-2',
    // Actions
    itemActions: 'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
    actionButton:
      'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center',
    actionIcon: 'w-4 h-4 flex-shrink-0',
    pinButton: 'p-1.5 rounded transition',
    deleteButton: 'p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition',
    // Toast
    toastContainer: 'fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-[slideIn_0.2s_ease-out]',
    toast: 'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
    toastIcon: 'w-5 h-5',
    toastText: 'text-sm font-medium',
    // buttons
    addToClipboard:
      'whitespace-nowrap rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50',
    clearAll: 'rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700',
    // Selection bubble menu
    selectionMenu: 'selection-menu fixed z-50 -translate-x-1/2 -translate-y-full',
    selectionBubble:
      'mb-2 flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-white shadow-xl',
    selectionText: 'max-w-[200px] truncate text-xs',
    selectionButton:
      'rounded bg-primary-700 px-2 py-1 text-xs font-medium whitespace-nowrap transition hover:bg-primary-500',
    selectionArrow: 'absolute bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900'
  },
  variants: {
    pinned: {
      true: {
        pinButton: 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20'
      },
      false: {
        pinButton: 'hover:bg-gray-200 dark:hover:bg-gray-700'
      }
    },
    type: {
      success: {
        toast: 'bg-green-500 text-white'
      },
      error: {
        toast: 'bg-red-500 text-white'
      },
      info: {
        toast: 'bg-blue-500 text-white'
      }
    }
  },
  defaultVariants: {
    pinned: false,
    type: 'success'
  }
});
tv({
  slots: {
    base: 'w-full mx-auto mt-20 max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden transform transition-all',
    search: 'rounded-b-none border-0 py-3',
    list: 'max-h-80 scroll-py-2 overflow-y-auto border-t border-gray-200 dark:border-gray-700',
    item: 'cursor-pointer select-none px-4 py-2 text-sm text-gray-900 dark:text-gray-100 aria-selected:bg-primary-600 aria-selected:text-white',
    itemDescription:
      'text-xs truncate text-gray-500 dark:text-gray-400 aria-selected:text-primary-100',
    empty:
      'px-4 py-14 text-center border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400',
    footer:
      'flex flex-wrap items-center justify-between gap-2 bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700',
    kbd: 'inline-flex items-center gap-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 font-sans text-xs'
  },
  variants: {
    selected: { true: {} }
  },
  defaultVariants: {}
});
tv({
  slots: {
    container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-2 md:p-4',
    column:
      'w-full rounded-xl shadow-sm p-3 md:p-4 flex flex-col bg-surface-elevated text-surface-foreground transition-colors',
    columnTitle: 'text-sm md:text-base font-semibold mb-2 md:mb-3 dark:text-white',
    cardList: 'flex flex-col gap-2 flex-1 min-h-[60px]',
    card: 'bg-surface text-surface-foreground rounded-lg p-2.5 md:p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:bg-surface-hover hover:shadow-md',
    cardTitle: 'font-medium text-sm md:text-base',
    cardDescription: 'text-xs md:text-sm text-muted mt-1',
    cardTags: 'flex flex-wrap gap-1 mt-2',
    cardTag: 'text-[10px] md:text-xs bg-primary/10 text-primary px-1.5 md:px-2 py-0.5 rounded-full',
    addButton:
      'mt-2 md:mt-3 w-full bg-primary text-primary-foreground rounded-lg py-1.5 text-xs md:text-sm dark:text-primary-500 font-medium hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2'
  },
  variants: {
    isDragOver: {
      true: {
        column: 'ring-2 ring-primary'
      }
    },
    isDragging: {
      true: {
        card: 'opacity-50'
      }
    }
  }
});
tv({
  slots: {
    card: 'bg-surface text-surface-foreground rounded-lg p-2.5 md:p-3 shadow-sm shadow-black/20 dark:shadow-white/10 cursor-grab active:cursor-grabbing transition-all hover:bg-surface-hover hover:shadow-md',
    cardTitle: 'font-medium text-sm md:text-base dark:text-white',
    cardDescription: 'text-xs md:text-sm text-muted mt-1 dark:text-white',
    cardTags: 'flex flex-wrap gap-1 mt-2 dark:text-white',
    cardTag:
      'text-[10px] md:text-xs bg-primary/10 text-primary px-1.5 md:px-2 py-0.5 rounded-full dark:text-white'
  },
  variants: {
    isDragging: {
      true: {
        card: 'opacity-50'
      }
    }
  }
});
tv({
  slots: {
    base: 'bg-white dark:bg-gray-900 p-2 transition-all duration-300 z-40 border-b border-gray-200 dark:border-gray-700',
    container: '',
    list: '',
    link: 'px-4 py-2.5 transition-all duration-200 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    li: 'p-2 m-1'
  },
  variants: {
    position: {
      top: {
        base: 'top-0 left-0 right-0 w-full',
        container: 'container mx-auto px-4',
        list: 'flex space-x-1 overflow-x-auto scrollbar-none'
      },
      left: {
        base: 'fixed left-0 top-0 bottom-0 h-full w-64 overflow-y-auto',
        container: 'px-4 py-4',
        list: 'flex flex-col space-y-1'
      },
      right: {
        base: 'fixed right-0 top-0 bottom-0 h-full w-64 overflow-y-auto',
        container: 'px-4 py-4',
        list: 'flex flex-col space-y-1'
      }
    },
    sticky: {
      true: {
        base: ''
      },
      false: {
        base: ''
      }
    },
    isSticky: {
      true: {
        base: 'shadow-lg'
      },
      false: {
        base: ''
      }
    },
    active: {
      true: {
        link: 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 font-semibold focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900'
      },
      false: {
        link: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
      }
    }
  },
  defaultVariants: {
    position: 'top',
    sticky: true,
    isSticky: false,
    active: false
  },
  compoundVariants: [
    {
      position: 'top',
      sticky: true,
      class: { base: 'sticky' }
    }
  ]
});
tv({
  base: 'relative flex h-full w-full overflow-hidden select-none',
  variants: {
    direction: {
      horizontal: '',
      vertical: 'flex-col'
    }
  },
  defaultVariants: {
    direction: 'horizontal'
  }
});
tv({
  base: 'flex flex-col relative overflow-hidden shrink-0 min-w-0 min-h-0'
});
tv({
  base: 'bg-gray-300 shrink-0 relative z-10 transition-colors duration-200 hover:bg-gray-400 focus:bg-gray-400 focus:outline focus:outline-2 focus:outline-blue-500 focus:-outline-offset-2',
  variants: {
    direction: {
      horizontal: 'w-1 cursor-col-resize',
      vertical: 'h-1 cursor-row-resize'
    },
    isDragging: {
      true: 'bg-blue-500',
      false: ''
    }
  },
  defaultVariants: {
    direction: 'horizontal',
    isDragging: false
  }
});
tv({
  base: 'absolute bg-transparent',
  variants: {
    direction: {
      horizontal: 'w-3 h-full -left-1 top-0',
      vertical: 'h-3 w-full -top-1 left-0'
    }
  },
  defaultVariants: {
    direction: 'horizontal'
  }
});
tv({
  slots: {
    overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm',
    highlight: [
      'fixed border-2 pointer-events-none transition-all duration-300',
      'border-blue-500',
      'shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
    ],
    tooltip: ['fixed bg-white rounded-xl shadow-2xl', 'w-80 max-w-[calc(100vw-2rem)]'],
    arrow: 'absolute w-2 h-2 rotate-45 bg-white',
    content: 'p-5 relative z-10 bg-white rounded-xl',
    title: 'text-lg font-semibold text-gray-900 mb-3',
    description: 'text-sm leading-relaxed text-gray-600 mb-4',
    progressContainer: 'flex gap-2 justify-center',
    progressDot: [
      'w-2 h-2 rounded-full bg-gray-300',
      'hover:bg-gray-400 transition-all duration-200 hover:scale-110'
    ],
    progressDotActive: '!bg-blue-500 !w-6 rounded',
    actions: [
      'flex justify-between items-center px-5 py-4',
      'border-t border-gray-200 relative z-10 bg-white rounded-b-xl'
    ],
    navigation: 'flex gap-2',
    button: ['px-4 py-2 rounded-md text-sm font-medium', 'transition-all duration-200'],
    buttonPrimary: ['text-white bg-blue-500 hover:bg-blue-600'],
    buttonSecondary: [
      'text-gray-600 border border-gray-300',
      'hover:bg-gray-50 hover:border-gray-400'
    ]
  },
  variants: {
    size: {
      sm: {
        tooltip: 'w-64',
        content: 'p-4',
        actions: 'px-4 py-3',
        title: 'text-base',
        description: 'text-xs',
        button: 'px-3 py-1.5 text-xs'
      },
      md: {
        tooltip: 'w-80',
        content: 'p-5',
        actions: 'px-5 py-4',
        title: 'text-lg',
        description: 'text-sm',
        button: 'px-4 py-2 text-sm'
      },
      lg: {
        tooltip: 'w-96',
        content: 'p-6',
        actions: 'px-6 py-5',
        title: 'text-xl',
        description: 'text-base',
        button: 'px-5 py-2.5 text-base'
      }
    },
    color: {
      primary: {
        highlight: 'border-primary-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]',
        progressDotActive: '!bg-primary-500',
        buttonPrimary: 'bg-primary-500 hover:bg-primary-600'
      },
      blue: {
        highlight: 'border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]',
        progressDotActive: '!bg-blue-500',
        buttonPrimary: 'bg-blue-500 hover:bg-blue-600'
      },
      purple: {
        highlight: 'border-purple-500 shadow-[0_0_0_4px_rgba(168,85,247,0.2)]',
        progressDotActive: '!bg-purple-500',
        buttonPrimary: 'bg-purple-500 hover:bg-purple-600'
      },
      green: {
        highlight: 'border-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]',
        progressDotActive: '!bg-green-500',
        buttonPrimary: 'bg-green-500 hover:bg-green-600'
      },
      red: {
        highlight: 'border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]',
        progressDotActive: '!bg-red-500',
        buttonPrimary: 'bg-red-500 hover:bg-red-600'
      }
    }
  },
  defaultVariants: {
    size: 'md',
    color: 'blue'
  }
});
tv({
  slots: {
    container:
      'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
    spacer: 'relative',
    content: 'absolute top-0 left-0 right-0',
    item: ''
  },
  variants: {
    contained: {
      true: { item: '[contain:layout_style_paint]' },
      false: {}
    }
  },
  defaultVariants: {
    contained: false
  }
});
tv({
  slots: {
    container:
      'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
    spacer: 'relative',
    content: 'relative w-full',
    item: ''
  },
  variants: {
    contained: {
      true: { item: '[contain:layout_style_paint]' },
      false: {}
    }
  },
  defaultVariants: {
    contained: false
  }
});
let analyzedDpe = { code: void 0 };
function getAnalyzedDpe() {
  return analyzedDpe;
}
function setAnalyzedDpe(newDpe) {
  analyzedDpe = newDpe;
}
function createDebug(namespace, enabled = enableDebug(namespace)) {
  if (!enabled) {
    return noop$1;
  }
  const color = selectColor(namespace);
  return function debug2(...args) {
    console.log(`%c${namespace}`, `color:${color}`, ...args);
  };
}
function enableDebug(namespace) {
  const debug2 = tryReadLocalStorage('debug');
  return debug2?.endsWith('*') ? namespace.startsWith(debug2.slice(0, -1)) : namespace === debug2;
}
function noop$1() {}
function tryReadLocalStorage(key) {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return window.localStorage[key];
    }
  } catch {}
  return void 0;
}
function selectColor(namespace) {
  let hash = 0;
  for (let i = 0; i < namespace.length; i++) {
    hash = (hash << 5) - hash + namespace.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
const colors = [
  '#0000CC',
  '#0099FF',
  '#009400',
  '#8dd200',
  '#CCCC00',
  '#CC9933',
  '#ae04e7',
  '#ff35d7',
  '#FF3333',
  '#FF6600',
  '#FF9933',
  '#FFCC33'
];
let id = 0;
function uniqueId() {
  id++;
  return id;
}
function int(value) {
  return parseInt(value, 10);
}
function containsNumber(value) {
  return NUMBER_REGEX.test(value);
}
const NUMBER_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
function isObject$1(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.constructor === void 0 || value.constructor.name === 'Object')
  );
}
function isObjectOrArray(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.constructor === void 0 ||
      value.constructor.name === 'Object' ||
      value.constructor.name === 'Array')
  );
}
function isBoolean(value) {
  return value === true || value === false;
}
function isTimestamp(value) {
  const YEAR_2000 = 9466848e5;
  if (typeof value === 'number') {
    return (
      value > YEAR_2000 &&
      isFinite(value) &&
      Math.floor(value) === value &&
      !isNaN(new Date(value).valueOf())
    );
  }
  if (typeof value === 'bigint') {
    return isTimestamp(Number(value));
  }
  try {
    const valueOf = value ? value.valueOf() : value;
    if (valueOf !== value) {
      return isTimestamp(valueOf);
    }
  } catch {
    return false;
  }
  return false;
}
function getColorCSS(color) {
  colorTestDiv = colorTestDiv || window.document.createElement('div');
  colorTestDiv.style.color = '';
  colorTestDiv.style.color = color;
  const applied = colorTestDiv.style.color;
  return applied !== '' ? applied.replace(/\s+/g, '').toLowerCase() : void 0;
}
let colorTestDiv = void 0;
function isColor(value) {
  const maxColorLength = 99;
  return typeof value === 'string' && value.length < maxColorLength && !!getColorCSS(value);
}
function valueType(value, parser) {
  if (
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined'
  ) {
    return typeof value;
  }
  if (typeof value === 'bigint') {
    return 'number';
  }
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (isObject$1(value)) {
    return 'object';
  }
  const valueStr = parser.stringify(value);
  if (valueStr && containsNumber(valueStr)) {
    return 'number';
  }
  if (valueStr === 'true' || valueStr === 'false') {
    return 'boolean';
  }
  if (valueStr === 'null') {
    return 'null';
  }
  return 'unknown';
}
const isUrlRegex = /^https?:\/\/\S+$/;
function isUrl(text) {
  return typeof text === 'string' && isUrlRegex.test(text);
}
function stringConvert(str, parser) {
  if (str === '') {
    return '';
  }
  const strTrim = str.trim();
  if (strTrim === 'null') {
    return null;
  }
  if (strTrim === 'true') {
    return true;
  }
  if (strTrim === 'false') {
    return false;
  }
  if (containsNumber(strTrim)) {
    return parser.parse(strTrim);
  }
  return str;
}
function isStringContainingPrimitiveValue(str) {
  return typeof str === 'string' && typeof stringConvert(str, JSON) !== 'string';
}
const MAX_ITEM_PATHS_COLLECTION = 1e4;
const ROOT_PATH = [];
function strictShallowEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function getNestedPaths(array, includeObjects = false) {
  const pointersMap = {};
  if (!Array.isArray(array)) {
    throw new TypeError('Array expected');
  }
  function recurseNestedPaths(obj, path) {
    const isValue = !Array.isArray(obj) && !isObject$1(obj);
    if (isValue || (includeObjects && path.length > 0)) {
      pointersMap[compileJSONPointer(path)] = true;
    }
    if (isObject$1(obj)) {
      Object.keys(obj).forEach((key) => {
        recurseNestedPaths(obj[key], path.concat(key));
      });
    }
  }
  const max = Math.min(array.length, MAX_ITEM_PATHS_COLLECTION);
  for (let i = 0; i < max; i++) {
    const item = array[i];
    recurseNestedPaths(item, ROOT_PATH);
  }
  const pathsArray = Object.keys(pointersMap).sort();
  return pathsArray.map(parseJSONPointer);
}
function forEachIndex(start, end, iteratee) {
  if (end <= start) {
    return;
  }
  for (let index = start; index < end; index++) {
    iteratee(index);
  }
}
function limit(array, max) {
  return array.length > max ? array.slice(0, max) : array;
}
function arrayToObject(array) {
  return {
    ...array
  };
}
function objectToArray(object) {
  return Object.values(object);
}
function moveItems(array, index, count, offset2) {
  const copy = array.slice(0);
  const moving = copy.splice(index, count);
  copy.splice.apply(copy, [index + offset2, 0, ...moving]);
  return copy;
}
function forEachSample(array, maxSampleCount, callback) {
  if (array.length < maxSampleCount) {
    array.forEach(callback);
  } else {
    const step = maxSampleCount > 1 ? (array.length - 1) / (maxSampleCount - 1) : array.length;
    for (let i = 0; i < maxSampleCount; i++) {
      const index = Math.floor(i * step);
      callback(array[index], index, array);
    }
  }
}
function insertItemsAt(array, index, items) {
  return array.slice(0, index).concat(items).concat(array.slice(index));
}
function parseAndRepair(jsonText, parser) {
  try {
    return parser.parse(jsonText);
  } catch {
    return parser.parse(jsonrepair(jsonText));
  }
}
function parseAndRepairOrUndefined(partialJson, parser) {
  try {
    return parseAndRepair(partialJson, parser);
  } catch {
    return void 0;
  }
}
function parsePartialJson(partialJson, parse2) {
  partialJson = partialJson.replace(END_WITH_COMMA_AND_OPTIONAL_WHITESPACES_REGEX, '');
  try {
    return parse2(partialJson);
  } catch {}
  try {
    return parse2('{' + partialJson + '}');
  } catch {}
  try {
    return parse2('[' + partialJson + ']');
  } catch {}
  throw new Error('Failed to parse partial JSON');
}
function repairPartialJson(partialJson) {
  partialJson = partialJson.replace(END_WITH_COMMA_AND_OPTIONAL_WHITESPACES_REGEX, '');
  try {
    return jsonrepair(partialJson);
  } catch {}
  try {
    const repaired = jsonrepair('[' + partialJson + ']');
    return repaired.substring(1, repaired.length - 1);
  } catch {}
  try {
    const repaired = jsonrepair('{' + partialJson + '}');
    return repaired.substring(1, repaired.length - 1);
  } catch {}
  throw new Error('Failed to repair partial JSON');
}
const END_WITH_COMMA_AND_OPTIONAL_WHITESPACES_REGEX = /,\s*$/;
function normalizeJsonParseError(jsonText, parseErrorMessage) {
  const positionMatch = POSITION_REGEX.exec(parseErrorMessage);
  if (positionMatch) {
    const position = int(positionMatch[2]);
    const line = countCharacterOccurrences(jsonText, '\n', 0, position);
    const lastIndex = jsonText.lastIndexOf('\n', position);
    const column = position - lastIndex - 1;
    return {
      position,
      line,
      column,
      message: parseErrorMessage.replace(POSITION_REGEX, () => {
        return `line ${line + 1} column ${column + 1}`;
      })
    };
  } else {
    const lineMatch = LINE_REGEX.exec(parseErrorMessage);
    const lineOneBased = lineMatch ? int(lineMatch[1]) : void 0;
    const line = lineOneBased !== void 0 ? lineOneBased - 1 : void 0;
    const columnMatch = COLUMN_REGEX.exec(parseErrorMessage);
    const columnOneBased = columnMatch ? int(columnMatch[1]) : void 0;
    const column = columnOneBased !== void 0 ? columnOneBased - 1 : void 0;
    const position =
      line !== void 0 && column !== void 0 ? calculatePosition(jsonText, line, column) : void 0;
    return {
      position,
      line,
      column,
      message: parseErrorMessage.replace(/^JSON.parse: /, '').replace(/ of the JSON data$/, '')
    };
  }
}
function calculatePosition(text, line, column) {
  let index = text.indexOf('\n');
  let i = 1;
  while (i < line && index !== -1) {
    index = text.indexOf('\n', index + 1);
    i++;
  }
  return index !== -1 ? index + column + 1 : void 0;
}
function countCharacterOccurrences(text, character, start = 0, end = text.length) {
  let count = 0;
  for (let i = start; i < end; i++) {
    if (text.charAt(i) === character) {
      count++;
    }
  }
  return count;
}
function findTextLocation(text, path) {
  try {
    const jsmap = jsonSourceMap.parse(text);
    const pointerName = compileJSONPointer(path);
    const pointer = jsmap.pointers[pointerName];
    if (pointer) {
      return {
        path,
        line: pointer.key ? pointer.key.line : pointer.value ? pointer.value.line : 0,
        column: pointer.key ? pointer.key.column : pointer.value ? pointer.value.column : 0,
        from: pointer.key ? pointer.key.pos : pointer.value ? pointer.value.pos : 0,
        to: pointer.keyEnd ? pointer.keyEnd.pos : pointer.valueEnd ? pointer.valueEnd.pos : 0
      };
    }
  } catch (err) {
    console.error(err);
  }
  return {
    path,
    line: 0,
    column: 0,
    from: 0,
    to: 0
  };
}
function convertValue(value, type, parser) {
  if (type === 'array') {
    if (Array.isArray(value)) {
      return value;
    }
    if (isObject$1(value)) {
      return objectToArray(value);
    }
    if (typeof value === 'string') {
      try {
        const parsedValue = parser.parse(value);
        if (Array.isArray(parsedValue)) {
          return parsedValue;
        }
        if (isObject$1(parsedValue)) {
          return objectToArray(parsedValue);
        }
      } catch {
        return [value];
      }
    }
    return [value];
  }
  if (type === 'object') {
    if (Array.isArray(value)) {
      return arrayToObject(value);
    }
    if (isObject$1(value)) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        const parsedValue = parser.parse(value);
        if (isObject$1(parsedValue)) {
          return parsedValue;
        }
        if (Array.isArray(parsedValue)) {
          return arrayToObject(parsedValue);
        }
      } catch {
        return { value };
      }
    }
    return { value };
  }
  if (type === 'value') {
    if (isObjectOrArray(value)) {
      return parser.stringify(value);
    }
    return value;
  }
  throw new Error(`Cannot convert ${valueType(value, parser)} to ${type}`);
}
function validateContentType(content) {
  if (!isObject$1(content)) {
    return 'Content must be an object';
  }
  if (content.json !== void 0) {
    if (content.text !== void 0) {
      return 'Content must contain either a property "json" or a property "text" but not both';
    } else {
      return void 0;
    }
  } else {
    if (content.text === void 0) {
      return 'Content must contain either a property "json" or a property "text"';
    } else if (typeof content.text !== 'string') {
      return 'Content "text" property must be a string containing a JSON document. Did you mean to use the "json" property instead?';
    } else {
      return void 0;
    }
  }
}
function isTextContent(content) {
  return isObject$1(content) && typeof content.text === 'string';
}
function isJSONContent(content) {
  return isObject$1(content) && typeof content.json !== 'undefined';
}
function toTextContent(content, indentation = void 0, parser = JSON) {
  return isTextContent(content)
    ? content
    : { text: parser.stringify(content.json, null, indentation) };
}
function getText(content, indentation, parser) {
  return toTextContent(content, indentation, parser).text;
}
function isLargeContent(content, maxSize) {
  return estimateSerializedSize(content, maxSize) > maxSize;
}
function estimateSerializedSize(content, maxSize = Infinity) {
  if (isTextContent(content)) {
    return content.text.length;
  }
  const json = content.json;
  let estimatedSize = 0;
  function recurse(json2) {
    if (Array.isArray(json2)) {
      estimatedSize += 2 + (json2.length - 1);
      if (estimatedSize > maxSize) {
        return;
      }
      for (let i = 0; i < json2.length; i++) {
        const item = json2[i];
        recurse(item);
        if (estimatedSize > maxSize) {
          return;
        }
      }
    } else if (isObject$1(json2)) {
      const keys = Object.keys(json2);
      estimatedSize += 2 + keys.length + (keys.length - 1);
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const value = json2[key];
        estimatedSize += key.length + 2;
        recurse(value);
      }
    } else if (typeof json2 === 'string') {
      estimatedSize += json2.length + 2;
    } else {
      estimatedSize += String(json2).length;
    }
  }
  recurse(json);
  return estimatedSize;
}
const POSITION_REGEX = /(position|char) (\d+)/;
const LINE_REGEX = /line (\d+)/;
const COLUMN_REGEX = /column (\d+)/;
function isEqualParser(a, b) {
  return a.parse === b.parse && a.stringify === b.stringify;
}
function needsFormatting(jsonText) {
  const maxLength = 999;
  const head = jsonText.substring(0, maxLength).trim();
  return !head.includes('\n') && DELIMITER_WITHOUT_SPACING_REGEX.test(head);
}
const DELIMITER_WITHOUT_SPACING_REGEX = /[,:]\S/;
var Mode;
(function (Mode2) {
  Mode2['text'] = 'text';
  Mode2['tree'] = 'tree';
  Mode2['table'] = 'table';
})(Mode || (Mode = {}));
var SelectionType;
(function (SelectionType2) {
  SelectionType2['after'] = 'after';
  SelectionType2['inside'] = 'inside';
  SelectionType2['key'] = 'key';
  SelectionType2['value'] = 'value';
  SelectionType2['multi'] = 'multi';
  SelectionType2['text'] = 'text';
})(SelectionType || (SelectionType = {}));
var CaretType;
(function (CaretType2) {
  CaretType2['after'] = 'after';
  CaretType2['key'] = 'key';
  CaretType2['value'] = 'value';
  CaretType2['inside'] = 'inside';
})(CaretType || (CaretType = {}));
var ValidationSeverity;
(function (ValidationSeverity2) {
  ValidationSeverity2['info'] = 'info';
  ValidationSeverity2['warning'] = 'warning';
  ValidationSeverity2['error'] = 'error';
})(ValidationSeverity || (ValidationSeverity = {}));
var SearchField;
(function (SearchField2) {
  SearchField2['key'] = 'key';
  SearchField2['value'] = 'value';
})(SearchField || (SearchField = {}));
var SortDirection;
(function (SortDirection2) {
  SortDirection2['asc'] = 'asc';
  SortDirection2['desc'] = 'desc';
})(SortDirection || (SortDirection = {}));
var UpdateSelectionAfterChange;
(function (UpdateSelectionAfterChange2) {
  UpdateSelectionAfterChange2['no'] = 'no';
  UpdateSelectionAfterChange2['self'] = 'self';
  UpdateSelectionAfterChange2['nextInside'] = 'nextInside';
})(UpdateSelectionAfterChange || (UpdateSelectionAfterChange = {}));
function createNormalizationFunctions({ escapeControlCharacters, escapeUnicodeCharacters }) {
  if (escapeControlCharacters) {
    if (escapeUnicodeCharacters) {
      return normalizeControlAndUnicode;
    } else {
      return normalizeControl;
    }
  } else {
    if (escapeUnicodeCharacters) {
      return normalizeUnicode;
    } else {
      return normalizeNothing;
    }
  }
}
const normalizeControlAndUnicode = {
  escapeValue: (value) => jsonEscapeUnicode(jsonEscapeControl(String(value))),
  unescapeValue: (value) => jsonUnescapeControl(jsonUnescapeUnicode(value))
};
const normalizeControl = {
  escapeValue: (value) => jsonEscapeControl(String(value)),
  unescapeValue: (value) => jsonUnescapeControl(value)
};
const normalizeUnicode = {
  escapeValue: (value) => jsonEscapeUnicode(String(value)),
  unescapeValue: (value) => jsonUnescapeUnicode(value)
};
const normalizeNothing = {
  escapeValue: (value) => String(value),
  unescapeValue: (value) => value
};
function jsonEscapeUnicode(value) {
  return value.replace(/[^\x20-\x7F]/g, (x) => {
    if (x === '\b' || x === '\f' || x === '\n' || x === '\r' || x === '	') {
      return x;
    }
    return '\\u' + ('000' + x.codePointAt(0)?.toString(16)).slice(-4);
  });
}
function jsonUnescapeUnicode(value) {
  return value.replace(/\\u[a-fA-F0-9]{4}/g, (x) => {
    try {
      const unescaped = JSON.parse('"' + x + '"');
      return controlCharacters[unescaped] || unescaped;
    } catch {
      return x;
    }
  });
}
const controlCharacters = {
  '"': '\\"',
  '\\': '\\\\',
  // escaped forward slash '\/' is the same as '/', we can't escape/unescape it
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '	': '\\t'
  // unicode is handled separately
};
const escapedControlCharacters = {
  '\\"': '"',
  '\\\\': '\\',
  // escaped forward slash '\/' is the same as '/', we can't escape/unescape it
  '\\/': '/',
  '\\b': '\b',
  '\\f': '\f',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '	'
  // unicode is handled separately
};
function jsonEscapeControl(value) {
  return value.replace(/["\b\f\n\r\t\\]/g, (x) => {
    return controlCharacters[x] || x;
  });
}
function jsonUnescapeControl(value) {
  return value.replace(/\\["bfnrt\\]/g, (x) => {
    return escapedControlCharacters[x] || x;
  });
}
function addNewLineSuffix(value) {
  if (typeof value !== 'string') {
    return String(value);
  }
  if (value.endsWith('\n')) {
    return value + '\n';
  }
  return value;
}
function isChildOfAttribute(element2, name, value) {
  return isChildOf(element2, (e) => hasAttribute(e, name, value));
}
function hasAttribute(element2, name, value) {
  return typeof element2.getAttribute === 'function' && element2.getAttribute(name) === value;
}
function isChildOf(element2, predicate) {
  return !!findParent(element2, predicate);
}
function findParent(element2, predicate) {
  let e = element2;
  while (e && !predicate(e)) {
    e = e.parentNode;
  }
  return e;
}
function getWindow(element2) {
  return element2?.ownerDocument?.defaultView ?? void 0;
}
function activeElementIsChildOf(element2) {
  const window2 = getWindow(element2);
  const activeElement = window2?.document.activeElement;
  return activeElement ? isChildOf(activeElement, (e) => e === element2) : false;
}
function findParentWithNodeName(element2, nodeName) {
  return findParent(element2, (e) => e.nodeName === nodeName);
}
function getSelectionTypeFromTarget(target) {
  if (isChildOfAttribute(target, 'data-type', 'selectable-key')) {
    return SelectionType.key;
  }
  if (isChildOfAttribute(target, 'data-type', 'selectable-value')) {
    return SelectionType.value;
  }
  if (isChildOfAttribute(target, 'data-type', 'insert-selection-area-inside')) {
    return SelectionType.inside;
  }
  if (isChildOfAttribute(target, 'data-type', 'insert-selection-area-after')) {
    return SelectionType.after;
  }
  return SelectionType.multi;
}
function encodeDataPath(path) {
  return encodeURIComponent(compileJSONPointer(path));
}
function decodeDataPath(pathStr) {
  return parseJSONPointer(decodeURIComponent(pathStr));
}
function getDataPathFromTarget(target) {
  const parent = findParent(target, (element2) => {
    return element2?.hasAttribute ? element2.hasAttribute('data-path') : false;
  });
  const dataPath = parent?.getAttribute('data-path') ?? void 0;
  return dataPath ? decodeDataPath(dataPath) : void 0;
}
function isMacDevice() {
  return (
    typeof navigator !== 'undefined' &&
    (navigator?.platform?.toUpperCase().includes('MAC') ??
      navigator?.userAgentData?.platform?.toUpperCase().includes('MAC') ??
      false)
  );
}
function keyComboFromEvent(event, separator = '+', isMac = isMacDevice) {
  const combi = [];
  if (isCtrlKeyDown(event, isMac)) {
    combi.push('Ctrl');
  }
  if (event.altKey) {
    combi.push('Alt');
  }
  if (event.shiftKey) {
    combi.push('Shift');
  }
  const keyName = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  if (!(keyName in metaKeys)) {
    combi.push(keyName);
  }
  return combi.join(separator);
}
function isCtrlKeyDown(event, isMac = isMacDevice) {
  return event.ctrlKey || (event.metaKey && isMac());
}
const metaKeys = {
  Ctrl: true,
  Command: true,
  Control: true,
  Alt: true,
  Option: true,
  Shift: true
};
function AbsolutePopupEntry($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let popup = $$props['popup'];
    let closeAbsolutePopup = $$props['closeAbsolutePopup'];
    $$renderer2.push(`<div role="none" class="jse-absolute-popup svelte-w643yj">`);
    {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { popup, closeAbsolutePopup });
  });
}
function AbsolutePopup($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const debug2 = createDebug('jsoneditor:AbsolutePopup');
    let popups = [];
    function openAbsolutePopup(component, props, options) {
      debug2('open...', props, options);
      const popup = {
        id: uniqueId(),
        component,
        props: props || {},
        options: options || {}
      };
      popups = [...popups, popup];
      return popup.id;
    }
    function closeAbsolutePopup(popupId) {
      const popupIndex = popups.findIndex((popup) => popup.id === popupId);
      if (popupIndex !== -1) {
        const popup = popups[popupIndex];
        if (popup.options.onClose) {
          popup.options.onClose();
        }
        popups = popups.filter((popup2) => popup2.id !== popupId);
      }
    }
    setContext('absolute-popup', { openAbsolutePopup, closeAbsolutePopup });
    debug2('popups', popups);
    $$renderer2.push(`<!--[-->`);
    const each_array = ensure_array_like(popups);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let popup = each_array[$$index];
      AbsolutePopupEntry($$renderer2, { popup, closeAbsolutePopup });
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    slot($$renderer2, $$props, 'default', {}, null);
    $$renderer2.push(`<!--]-->`);
  });
}
function findUniqueName(name, keys) {
  const keysSet = new Set(keys);
  const nameWithoutCopySuffix = name.replace(/ \(copy( \d+)?\)$/, '');
  let validName = name;
  let i = 1;
  while (keysSet.has(validName)) {
    const copy = 'copy' + (i > 1 ? ' ' + i : '');
    validName = `${nameWithoutCopySuffix} (${copy})`;
    i++;
  }
  return validName;
}
function truncate(text, maxLength) {
  const ellipsis = '...';
  const maxTextLength = maxLength - ellipsis.length;
  return text.length > maxLength ? text.substring(0, maxTextLength) + ellipsis : text;
}
function parseString(str) {
  if (str === '') {
    return '';
  }
  const lower = str.toLowerCase();
  if (lower === 'null') {
    return null;
  }
  if (lower === 'true') {
    return true;
  }
  if (lower === 'false') {
    return false;
  }
  if (lower === 'undefined') {
    return void 0;
  }
  const num = Number(str);
  const numFloat = parseFloat(str);
  if (!isNaN(num) && !isNaN(numFloat)) {
    return num;
  }
  return str;
}
const description = `
<p>
  Enter a <a href="https://jsonquerylang.org" target="_blank" 
  rel="noopener noreferrer">JSON Query</a> function to filter, sort, or transform the data.
  You can use functions like <code>get</code>, <code>filter</code>,
  <code>sort</code>, <code>pick</code>, <code>groupBy</code>, <code>uniq</code>, etcetera. 
  Example query: <code>filter(.age >= 18)</code>
</p>
`;
const jsonQueryLanguage = {
  id: 'jsonquery',
  name: 'JSONQuery',
  description,
  createQuery,
  executeQuery
};
function createQuery(_json, queryOptions) {
  const { filter: filter2, sort, projection } = queryOptions;
  const queryFunctions = [];
  if (filter2 && filter2.path && filter2.relation && filter2.value) {
    queryFunctions.push([
      'filter',
      [getOperatorName(filter2.relation), getter(filter2.path), parseString(filter2.value)]
    ]);
  }
  if (sort && sort.path && sort.direction) {
    queryFunctions.push(['sort', getter(sort.path), sort.direction === 'desc' ? 'desc' : 'asc']);
  }
  if (projection && projection.paths) {
    if (projection.paths.length > 1) {
      queryFunctions.push(['pick', ...projection.paths.map(getter)]);
    } else {
      queryFunctions.push(['map', getter(projection.paths[0])]);
    }
  }
  return stringify(['pipe', ...queryFunctions]);
}
function getter(path) {
  return ['get', ...path];
}
function executeQuery(json, query, parser) {
  function stringifyAndParse(json2) {
    const text = parser.stringify(json2);
    return text !== void 0 ? JSON.parse(text) : void 0;
  }
  const preprocessedJson = isEqualParser(parser, JSON) ? json : stringifyAndParse(json);
  return query.trim() !== '' ? jsonquery(preprocessedJson, query) : preprocessedJson;
}
function getOperatorName(operator) {
  return parse(`1 ${operator} 1`)[0];
}
function Raw($$renderer, $$props) {
  let cursor = 870711;
  function getId() {
    cursor += 1;
    return `fa-${cursor.toString(16)}`;
  }
  let raw = '';
  let data = $$props['data'];
  function getRaw(data2) {
    if (!data2 || !data2.raw) {
      return '';
    }
    let rawData = data2.raw;
    const ids = {};
    rawData = rawData.replace(/\s(?:xml:)?id=["']?([^"')\s]+)/g, (match, id2) => {
      const uniqueId2 = getId();
      ids[id2] = uniqueId2;
      return ` id="${uniqueId2}"`;
    });
    rawData = rawData.replace(
      /#(?:([^'")\s]+)|xpointer\(id\((['"]?)([^')]+)\2\)\))/g,
      (match, rawId, _, pointerId) => {
        const id2 = rawId || pointerId;
        if (!id2 || !ids[id2]) {
          return match;
        }
        return `#${ids[id2]}`;
      }
    );
    return rawData;
  }
  raw = getRaw(data);
  $$renderer.push(`<g>${html(raw)}</g>`);
  bind_props($$props, { data });
}
function Svg($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, [
    'class',
    'width',
    'height',
    'box',
    'spin',
    'inverse',
    'pulse',
    'flip',
    'style',
    'label'
  ]);
  let className = fallback($$props['class'], '');
  let width = $$props['width'];
  let height = $$props['height'];
  let box = fallback($$props['box'], '0 0 0 0');
  let spin = fallback($$props['spin'], false);
  let inverse = fallback($$props['inverse'], false);
  let pulse = fallback($$props['pulse'], false);
  let flip2 = fallback($$props['flip'], 'none');
  let style = fallback($$props['style'], '');
  let label2 = fallback($$props['label'], '');
  $$renderer.push(
    `<svg${attributes(
      {
        version: '1.1',
        class: `fa-icon ${stringify$1(className)}`,
        width,
        height,
        'aria-label': label2,
        role: label2 ? 'img' : 'presentation',
        viewBox: box,
        style,
        ...$$restProps
      },
      'svelte-v67cny',
      {
        'fa-spin': spin,
        'fa-pulse': pulse,
        'fa-inverse': inverse,
        'fa-flip-horizontal': flip2 === 'horizontal',
        'fa-flip-vertical': flip2 === 'vertical'
      },
      void 0,
      3
    )}><!--[-->`
  );
  slot($$renderer, $$props, 'default', {}, null);
  $$renderer.push(`<!--]--></svg>`);
  bind_props($$props, {
    class: className,
    width,
    height,
    box,
    spin,
    inverse,
    pulse,
    flip: flip2,
    style,
    label: label2
  });
}
function Icon($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, [
    'class',
    'data',
    'scale',
    'spin',
    'inverse',
    'pulse',
    'flip',
    'label',
    'style'
  ]);
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props['class'], '');
    let data = $$props['data'];
    let iconData;
    let scale = fallback($$props['scale'], 1);
    let spin = fallback($$props['spin'], false);
    let inverse = fallback($$props['inverse'], false);
    let pulse = fallback($$props['pulse'], false);
    let flip2 = fallback($$props['flip'], void 0);
    let label2 = fallback($$props['label'], '');
    let style = fallback($$props['style'], '');
    let outerScale = 1;
    let width = 10;
    let height = 10;
    let combinedStyle;
    let box;
    function normaliseData(data2) {
      let name;
      let iconData2;
      if (!data2) {
        return void 0;
      } else if ('definition' in data2) {
        console.error(
          "`import faIconName from '@fortawesome/package-name/faIconName` not supported - Please use `import { faIconName } from '@fortawesome/package-name/faIconName'` instead"
        );
        return void 0;
      } else if ('iconName' in data2 && 'icon' in data2) {
        name = data2.iconName;
        const [width2, height2, , , path] = data2.icon;
        const paths = Array.isArray(path) ? path : [path];
        iconData2 = {
          width: width2,
          height: height2,
          paths: paths.map((path2) => {
            return { d: path2 };
          })
        };
      } else {
        name = Object.keys(data2)[0];
        iconData2 = data2[name];
      }
      return iconData2;
    }
    function normalisedScale() {
      let numScale = 1;
      if (typeof scale !== 'undefined') {
        numScale = Number(scale);
      }
      if (isNaN(numScale) || numScale <= 0) {
        console.warn('Invalid prop: prop "scale" should be a number over 0.');
        return outerScale;
      }
      return numScale * outerScale;
    }
    function calculateBox() {
      if (iconData) {
        return `0 0 ${iconData.width} ${iconData.height}`;
      }
      return `0 0 ${width} ${height}`;
    }
    function calculateRatio() {
      if (!iconData) {
        return 1;
      }
      return Math.max(iconData.width, iconData.height) / 16;
    }
    function calculateWidth() {
      if (iconData) {
        return (iconData.width / calculateRatio()) * normalisedScale();
      }
      return 0;
    }
    function calculateHeight() {
      if (iconData) {
        return (iconData.height / calculateRatio()) * normalisedScale();
      }
      return 0;
    }
    function calculateStyle() {
      let combined = '';
      if (style !== null) {
        combined += style;
      }
      let size = normalisedScale();
      if (size === 1) {
        if (combined.length === 0) {
          return '';
        }
        return combined;
      }
      if (combined !== '' && !combined.endsWith(';')) {
        combined += '; ';
      }
      return `${combined}font-size: ${size}em`;
    }
    {
      iconData = normaliseData(data);
      width = calculateWidth();
      height = calculateHeight();
      combinedStyle = calculateStyle();
      box = calculateBox();
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Svg(
        $$renderer3,
        spread_props([
          {
            label: label2,
            width,
            height,
            box,
            style: combinedStyle,
            spin,
            flip: flip2,
            inverse,
            pulse,
            class: className
          },
          $$restProps,
          {
            children: ($$renderer4) => {
              $$renderer4.push(`<!--[-->`);
              slot($$renderer4, $$props, 'default', {}, () => {
                $$renderer4.push(`<!--[-->`);
                const each_array = ensure_array_like(iconData?.paths || []);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let path = each_array[$$index];
                  $$renderer4.push(
                    `<path${attributes({ ...path }, void 0, void 0, void 0, 3)}></path>`
                  );
                }
                $$renderer4.push(`<!--]--><!--[-->`);
                const each_array_1 = ensure_array_like(iconData?.polygons || []);
                for (
                  let $$index_1 = 0, $$length = each_array_1.length;
                  $$index_1 < $$length;
                  $$index_1++
                ) {
                  let polygon = each_array_1[$$index_1];
                  $$renderer4.push(
                    `<polygon${attributes({ ...polygon }, void 0, void 0, void 0, 3)}></polygon>`
                  );
                }
                $$renderer4.push(`<!--]-->`);
                if (iconData?.raw) {
                  $$renderer4.push('<!--[-->');
                  Raw($$renderer4, {
                    get data() {
                      return iconData;
                    },
                    set data($$value) {
                      iconData = $$value;
                      $$settled = false;
                    }
                  });
                } else {
                  $$renderer4.push('<!--[!-->');
                }
                $$renderer4.push(`<!--]-->`);
              });
              $$renderer4.push(`<!--]-->`);
            },
            $$slots: { default: true }
          }
        ])
      );
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      class: className,
      data,
      scale,
      spin,
      inverse,
      pulse,
      flip: flip2,
      label: label2,
      style
    });
  });
}
function BooleanToggle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let path = $$props['path'];
    let value = $$props['value'];
    let readOnly = $$props['readOnly'];
    let onPatch = $$props['onPatch'];
    let focus = $$props['focus'];
    $$renderer2.push(
      `<div role="checkbox" tabindex="-1"${attr('aria-checked', value === true)}${attr_class('jse-boolean-toggle svelte-16dbi57', void 0, { 'jse-readonly': readOnly })}${attr('title', !readOnly ? 'Click to toggle this boolean value' : `Boolean value ${value}`)}>`
    );
    Icon($$renderer2, { data: value === true ? faCheckSquare : faSquare });
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { path, value, readOnly, onPatch, focus });
  });
}
function ColorPicker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let color, title;
    const { openAbsolutePopup } = getContext('absolute-popup');
    let path = $$props['path'];
    let value = $$props['value'];
    let readOnly = $$props['readOnly'];
    let onPatch = $$props['onPatch'];
    let focus = $$props['focus'];
    color = getColorCSS(value);
    title = !readOnly ? 'Click to open a color picker' : `Color ${value}`;
    $$renderer2.push(
      `<button type="button"${attr_class('jse-color-picker-button svelte-1wgct3c', void 0, { 'jse-readonly': readOnly })}${attr_style(`background: ${stringify$1(color)}`)}${attr('title', title)}${attr('aria-label', title)}></button>`
    );
    bind_props($$props, { path, value, readOnly, onPatch, focus });
  });
}
const DEBOUNCE_DELAY = 300;
const TEXT_MODE_ONCHANGE_DELAY = 300;
const MAX_SEARCH_RESULTS = 1e3;
const ARRAY_SECTION_SIZE = 100;
const MAX_VALIDATION_ERRORS = 100;
const MAX_CHARACTERS_TEXT_PREVIEW = 2e4;
const MAX_INLINE_OBJECT_CHARS = 50;
const MAX_HEADER_NAME_CHARACTERS = 50;
const DEFAULT_VISIBLE_SECTIONS = [{ start: 0, end: ARRAY_SECTION_SIZE }];
const MAX_VALIDATABLE_SIZE = 100 * 1024 * 1024;
const MAX_AUTO_REPAIRABLE_SIZE = 1024 * 1024;
const MAX_MULTILINE_PASTE_SIZE = 1024 * 1024;
const MAX_DOCUMENT_SIZE_TEXT_MODE = 10 * 1024 * 1024;
const MAX_DOCUMENT_SIZE_EXPAND_ALL = 10 * 1024;
const INSERT_EXPLANATION =
  'Insert or paste contents, enter [ insert a new array, enter { to insert a new object, or start typing to insert a new value';
const CONTEXT_MENU_EXPLANATION =
  'Open context menu (Click here, right click on the selection, or use the context menu button or Ctrl+Q)';
const HOVER_INSERT_INSIDE = 'hover-insert-inside';
const HOVER_INSERT_AFTER = 'hover-insert-after';
const HOVER_COLLECTION = 'hover-collection';
const JSON_STATUS_VALID = 'valid';
const JSON_STATUS_REPAIRABLE = 'repairable';
const JSON_STATUS_INVALID = 'invalid';
const CONTEXT_MENU_HEIGHT = (40 + 2) * 8;
const CONTEXT_MENU_WIDTH = 260;
const SEARCH_BOX_HEIGHT = 100;
const SORT_DIRECTION_NAMES = {
  [SortDirection.asc]: 'ascending',
  [SortDirection.desc]: 'descending'
};
function getExpandItemsSections(startIndex, endIndex) {
  const section1 = {
    start: startIndex,
    end: Math.min(nextRoundNumber(startIndex), endIndex)
  };
  const start2 = Math.max(currentRoundNumber((startIndex + endIndex) / 2), startIndex);
  const section2 = {
    start: start2,
    end: Math.min(nextRoundNumber(start2), endIndex)
  };
  const currentIndex = currentRoundNumber(endIndex);
  const previousIndex =
    currentIndex === endIndex ? currentIndex - ARRAY_SECTION_SIZE : currentIndex;
  const section3 = {
    start: Math.max(previousIndex, startIndex),
    end: endIndex
  };
  const sections = [section1];
  const showSection2 = section2.start >= section1.end && section2.end <= section3.start;
  if (showSection2) {
    sections.push(section2);
  }
  const showSection3 = section3.start >= (showSection2 ? section2.end : section1.end);
  if (showSection3) {
    sections.push(section3);
  }
  return sections;
}
function mergeSections(sections) {
  const sortedSections = sortBy(sections, (section) => section.start);
  const mergedSections = [sortedSections[0]];
  for (let sortedIndex = 0; sortedIndex < sortedSections.length; sortedIndex++) {
    const mergedIndex = mergedSections.length - 1;
    const previous = mergedSections[mergedIndex];
    const current = sortedSections[sortedIndex];
    if (current.start <= previous.end) {
      mergedSections[mergedIndex] = {
        start: Math.min(previous.start, current.start),
        end: Math.max(previous.end, current.end)
      };
    } else {
      mergedSections.push(current);
    }
  }
  return mergedSections;
}
function inVisibleSection(sections, index) {
  return sections.some((section) => {
    return index >= section.start && index < section.end;
  });
}
function nextRoundNumber(index) {
  return currentRoundNumber(index) + ARRAY_SECTION_SIZE;
}
function currentRoundNumber(index) {
  return Math.floor(index / ARRAY_SECTION_SIZE) * ARRAY_SECTION_SIZE;
}
function isMenuSpace(item) {
  return item ? item['type'] === 'space' || item['space'] === true : false;
}
function isMenuSeparator(item) {
  return item ? item['type'] === 'separator' || item['separator'] === true : false;
}
function isMenuLabel(item) {
  return item ? item['type'] === 'label' && typeof item['text'] === 'string' : false;
}
function isMenuButton(item) {
  return item ? typeof item['onClick'] === 'function' : false;
}
function isMenuDropDownButton(item) {
  return item
    ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      item['type'] === 'dropdown-button' && // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        isMenuButton(item['main']) && // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Array.isArray(item['items'])
    : false;
}
function isContextMenuRow(item) {
  return item ? item['type'] === 'row' && Array.isArray(item['items']) : false;
}
function isContextMenuColumn(item) {
  return item ? item['type'] === 'column' && Array.isArray(item['items']) : false;
}
function isContentParseError(contentErrors) {
  return isObject$1(contentErrors) && isObject$1(contentErrors['parseError']);
}
function isValidationError(value) {
  return (
    isObject$1(value) &&
    Array.isArray(value.path) &&
    typeof value.message === 'string' &&
    'severity' in value
  );
}
function isNestedValidationError(value) {
  return isObject$1(value) && isValidationError(value) && typeof value.isChildError === 'boolean';
}
function isSvelteActionRenderer(value) {
  return isObject$1(value) && typeof value.action === 'function' && isObject$1(value.props);
}
function isObjectRecursiveState(state) {
  return state !== void 0 && state.type === 'object';
}
function isArrayRecursiveState(state) {
  return state !== void 0 && state.type === 'array';
}
function isValueRecursiveState(state) {
  return state !== void 0 && state.type === 'value';
}
function isExpandableState(state) {
  return isObjectRecursiveState(state) || isArrayRecursiveState(state);
}
function hasSearchResults(state) {
  return state !== void 0 && Array.isArray(state.searchResults);
}
function isTreeHistoryItem(historyItem) {
  return historyItem ? historyItem.type === 'tree' : false;
}
function isTextHistoryItem(historyItem) {
  return historyItem ? historyItem.type === 'text' : false;
}
function isModeHistoryItem(historyItem) {
  return historyItem ? historyItem.type === 'mode' : false;
}
function createRecursiveState({ json, factory }) {
  return Array.isArray(json)
    ? factory.createArrayDocumentState()
    : isObject$1(json)
      ? factory.createObjectDocumentState()
      : json !== void 0
        ? factory.createValueDocumentState()
        : void 0;
}
function createDocumentState({ json, expand }) {
  const documentState = createRecursiveState({
    json,
    factory: documentStateFactory
  });
  return expand && documentState ? expandPath(json, documentState, [], expand) : documentState;
}
function createArrayDocumentState({ expanded } = { expanded: false }) {
  return { type: 'array', expanded, visibleSections: DEFAULT_VISIBLE_SECTIONS, items: [] };
}
function createObjectDocumentState({ expanded } = { expanded: false }) {
  return { type: 'object', expanded, properties: {} };
}
function createValueDocumentState() {
  return { type: 'value' };
}
const documentStateFactory = {
  createObjectDocumentState,
  createArrayDocumentState,
  createValueDocumentState
};
function ensureRecursiveState(
  json,
  documentState,
  path,
  {
    createObjectDocumentState: createObjectDocumentState2,
    createArrayDocumentState: createArrayDocumentState2,
    createValueDocumentState: createValueDocumentState2
  }
) {
  function recurse(value, state, path2) {
    if (Array.isArray(value)) {
      const arrayState = isArrayRecursiveState(state) ? state : createArrayDocumentState2();
      if (path2.length === 0) {
        return arrayState;
      }
      const index = int(path2[0]);
      const itemState = recurse(value[index], arrayState.items[index], path2.slice(1));
      return setIn(arrayState, ['items', path2[0]], itemState);
    }
    if (isObject$1(value)) {
      const objectState = isObjectRecursiveState(state) ? state : createObjectDocumentState2();
      if (path2.length === 0) {
        return objectState;
      }
      const key = path2[0];
      const itemState = recurse(value[key], objectState.properties[key], path2.slice(1));
      return setIn(objectState, ['properties', key], itemState);
    }
    return isValueRecursiveState(state) ? state : createValueDocumentState2();
  }
  return recurse(json, documentState, path);
}
function syncDocumentState(json, documentState, path = []) {
  return _transformDocumentState(
    json,
    documentState,
    path,
    (nestedJson, nestedState) => {
      if (nestedJson === void 0 || nestedState === void 0) {
        return void 0;
      }
      if (Array.isArray(nestedJson)) {
        if (isArrayRecursiveState(nestedState)) {
          return nestedState;
        }
        const expanded = isExpandableState(nestedState) ? nestedState.expanded : false;
        return createArrayDocumentState({ expanded });
      }
      if (isObject$1(nestedJson)) {
        if (isObjectRecursiveState(nestedState)) {
          return nestedState;
        }
        const expanded = isExpandableState(nestedState) ? nestedState.expanded : false;
        return createObjectDocumentState({ expanded });
      }
      if (isValueRecursiveState(nestedState)) {
        return nestedState;
      }
      return void 0;
    },
    () => true
  );
}
function _transformDocumentState(json, documentState, path, callback, recurse) {
  const updatedState = callback(json, documentState, path);
  if (Array.isArray(json) && isArrayRecursiveState(updatedState) && recurse(updatedState)) {
    const items = [];
    forEachVisibleIndex(json, updatedState.visibleSections, (index) => {
      const itemPath = path.concat(String(index));
      const value = json[index];
      const item = updatedState.items[index];
      const updatedItem = _transformDocumentState(value, item, itemPath, callback, recurse);
      if (updatedItem !== void 0) {
        items[index] = updatedItem;
      }
    });
    const changed = !strictShallowEqual(items, updatedState.items);
    return changed ? { ...updatedState, items } : updatedState;
  }
  if (isObject$1(json) && isObjectRecursiveState(updatedState) && recurse(updatedState)) {
    const properties = {};
    Object.keys(json).forEach((key) => {
      const propPath = path.concat(key);
      const value = json[key];
      const prop = updatedState.properties[key];
      const updatedProp = _transformDocumentState(value, prop, propPath, callback, recurse);
      if (updatedProp !== void 0) {
        properties[key] = updatedProp;
      }
    });
    const changed = !strictShallowEqual(
      Object.values(properties),
      Object.values(updatedState.properties)
    );
    return changed ? { ...updatedState, properties } : updatedState;
  }
  return updatedState;
}
function forEachVisibleIndex(jsonArray, visibleSections, callback) {
  visibleSections.forEach(({ start, end }) => {
    forEachIndex(start, Math.min(jsonArray.length, end), callback);
  });
}
function expandVisibleSection(state, index) {
  if (inVisibleSection(state.visibleSections, index)) {
    return state;
  }
  const start = currentRoundNumber(index);
  const end = nextRoundNumber(start);
  const newVisibleSection = { start, end };
  return {
    ...state,
    visibleSections: mergeSections(state.visibleSections.concat(newVisibleSection))
  };
}
function toRecursiveStatePath(json, path) {
  let value = json;
  const recursiveStatePath = [];
  let i = 0;
  while (i < path.length) {
    if (Array.isArray(value)) {
      const index = path[i];
      recursiveStatePath.push('items', index);
      value = value[int(index)];
    } else if (isObject$1(value)) {
      const key = path[i];
      recursiveStatePath.push('properties', key);
      value = value[key];
    } else {
      throw new Error(`Cannot convert path: Object or Array expected at index ${i}`);
    }
    i++;
  }
  return recursiveStatePath;
}
function expandPath(json, documentState, path, callback) {
  let updatedState = documentState;
  for (let i = 0; i < path.length; i++) {
    const partialPath = path.slice(0, i);
    updatedState = updateInDocumentState(json, updatedState, partialPath, (_, nestedState) => {
      const updatedState2 =
        isExpandableState(nestedState) && !nestedState.expanded
          ? { ...nestedState, expanded: true }
          : nestedState;
      if (isArrayRecursiveState(updatedState2)) {
        const index = int(path[i]);
        return expandVisibleSection(updatedState2, index);
      }
      return updatedState2;
    });
  }
  return updateInDocumentState(json, updatedState, path, (nestedValue, nestedState) => {
    const relativePath = [];
    return _expandRecursively(nestedValue, nestedState, relativePath, callback);
  });
}
function _expandRecursively(json, documentState, path, callback) {
  return _transformDocumentState(
    json,
    documentState,
    path,
    (nestedJson, nestedState, nestedPath) => {
      if (Array.isArray(nestedJson) && callback(nestedPath)) {
        return isArrayRecursiveState(nestedState)
          ? nestedState.expanded
            ? nestedState
            : { ...nestedState, expanded: true }
          : createArrayDocumentState({ expanded: true });
      }
      if (isObject$1(nestedJson) && callback(nestedPath)) {
        return isObjectRecursiveState(nestedState)
          ? nestedState.expanded
            ? nestedState
            : { ...nestedState, expanded: true }
          : createObjectDocumentState({ expanded: true });
      }
      return nestedState;
    },
    (nestedState) => isExpandableState(nestedState) && nestedState.expanded
  );
}
function collapsePath(json, documentState, path, recursive) {
  return updateInDocumentState(json, documentState, path, (nestedJson, nestedState) => {
    return recursive ? _collapseRecursively(nestedJson, nestedState, path) : _collapse(nestedState);
  });
}
function _collapse(documentState) {
  if (isArrayRecursiveState(documentState) && documentState.expanded) {
    return { ...documentState, expanded: false, visibleSections: DEFAULT_VISIBLE_SECTIONS };
  }
  if (isObjectRecursiveState(documentState) && documentState.expanded) {
    return { ...documentState, expanded: false };
  }
  return documentState;
}
function _collapseRecursively(json, documentState, path) {
  return _transformDocumentState(
    json,
    documentState,
    path,
    (_, nestedState) => _collapse(nestedState),
    () => true
  );
}
function expandSection(json, documentState, path, section) {
  return updateInDocumentState(json, documentState, path, (_value, state) => {
    if (!isArrayRecursiveState(state)) {
      return state;
    }
    const visibleSections = mergeSections(state.visibleSections.concat(section));
    return { ...state, visibleSections };
  });
}
function documentStatePatch(json, documentState, operations) {
  const initial2 = { json, documentState };
  const result = operations.reduce((current, operation) => {
    return {
      json: immutableJSONPatch(current.json, [operation]),
      documentState: _documentStatePatch(current.json, current.documentState, operation)
    };
  }, initial2);
  return {
    json: result.json,
    documentState: syncDocumentState(result.json, result.documentState)
    // sync to clean up leftover state
  };
}
function _documentStatePatch(json, documentState, operation) {
  if (isJSONPatchAdd(operation)) {
    return documentStateAdd(json, documentState, operation, void 0);
  }
  if (isJSONPatchRemove(operation)) {
    return documentStateRemove(json, documentState, operation);
  }
  if (isJSONPatchReplace(operation)) {
    const path = parsePath(json, operation.path);
    const enforceString = getEnforceString(json, documentState, path);
    if (enforceString) {
      return setInDocumentState(json, documentState, path, { type: 'value', enforceString });
    }
    return documentState;
  }
  if (isJSONPatchCopy(operation) || isJSONPatchMove(operation)) {
    return documentStateMoveOrCopy(json, documentState, operation);
  }
  return documentState;
}
function getInRecursiveState(json, documentState, path) {
  try {
    return getIn(documentState, toRecursiveStatePath(json, path));
  } catch {
    return void 0;
  }
}
function setInRecursiveState(json, recursiveState, path, value, factory) {
  const ensuredState = ensureRecursiveState(json, recursiveState, path, factory);
  return setIn(ensuredState, toRecursiveStatePath(json, path), value);
}
function updateInRecursiveState(json, documentState, path, transform, factory) {
  const ensuredState = ensureRecursiveState(json, documentState, path, factory);
  return updateIn(ensuredState, toRecursiveStatePath(json, path), (nestedState) => {
    const value = getIn(json, path);
    return transform(value, nestedState);
  });
}
function setInDocumentState(json, documentState, path, value) {
  return setInRecursiveState(json, documentState, path, value, documentStateFactory);
}
function updateInDocumentState(json, documentState, path, transform) {
  return updateInRecursiveState(json, documentState, path, transform, documentStateFactory);
}
function deleteInDocumentState(json, documentState, path) {
  const recursivePath = toRecursiveStatePath(json, path);
  return existsIn(documentState, recursivePath)
    ? deleteIn(documentState, toRecursiveStatePath(json, path))
    : documentState;
}
function documentStateAdd(json, documentState, operation, stateValue) {
  const path = parsePath(json, operation.path);
  const parentPath = initial(path);
  let updatedState = documentState;
  updatedState = updateInDocumentState(json, updatedState, parentPath, (_parent, arrayState) => {
    if (!isArrayRecursiveState(arrayState)) {
      return arrayState;
    }
    const index = int(last(path));
    const { items, visibleSections } = arrayState;
    return {
      ...arrayState,
      items:
        index < items.length
          ? insertItemsAt(items, index, stateValue !== void 0 ? [stateValue] : Array(1))
          : items,
      visibleSections: shiftVisibleSections(visibleSections, index, 1)
    };
  });
  return setInDocumentState(json, updatedState, path, stateValue);
}
function documentStateRemove(json, documentState, operation) {
  const path = parsePath(json, operation.path);
  const parentPath = initial(path);
  const parent = getIn(json, parentPath);
  if (Array.isArray(parent)) {
    return updateInDocumentState(json, documentState, parentPath, (_parent, arrayState) => {
      if (!isArrayRecursiveState(arrayState)) {
        return arrayState;
      }
      const index = int(last(path));
      const { items, visibleSections } = arrayState;
      return {
        ...arrayState,
        items: items.slice(0, index).concat(items.slice(index + 1)),
        visibleSections: shiftVisibleSections(visibleSections, index, -1)
      };
    });
  }
  return deleteInDocumentState(json, documentState, path);
}
function documentStateMoveOrCopy(json, documentState, operation) {
  if (isJSONPatchMove(operation) && operation.from === operation.path) {
    return documentState;
  }
  let updatedState = documentState;
  const from = parsePath(json, operation.from);
  const stateValue = getInRecursiveState(json, updatedState, from);
  if (isJSONPatchMove(operation)) {
    updatedState = documentStateRemove(json, updatedState, {
      path: operation.from
    });
  }
  updatedState = documentStateAdd(
    json,
    updatedState,
    {
      path: operation.path
    },
    stateValue
  );
  return updatedState;
}
function shiftVisibleSections(visibleSections, index, offset2) {
  const shiftedSections = visibleSections.map((section) => {
    return {
      start: section.start > index ? section.start + offset2 : section.start,
      end: section.end > index ? section.end + offset2 : section.end
    };
  });
  return mergeAdjacentSections(shiftedSections);
}
function mergeAdjacentSections(visibleSections) {
  const merged = visibleSections.slice(0);
  let i = 1;
  while (i < merged.length) {
    if (merged[i - 1].end === merged[i].start) {
      merged[i - 1] = {
        start: merged[i - 1].start,
        end: merged[i].end
      };
      merged.splice(i);
    }
    i++;
  }
  return merged;
}
function getEnforceString(json, documentState, path) {
  const value = getIn(json, path);
  const nestedState = getInRecursiveState(json, documentState, path);
  const enforceString = isValueRecursiveState(nestedState) ? nestedState.enforceString : void 0;
  if (typeof enforceString === 'boolean') {
    return enforceString;
  }
  return isStringContainingPrimitiveValue(value);
}
function getNextKeys(keys, key, includeKey = false) {
  const index = keys.indexOf(key);
  if (index !== -1) {
    return includeKey ? keys.slice(index) : keys.slice(index + 1);
  } else {
    return [];
  }
}
function getVisiblePaths(json, documentState) {
  const paths = [];
  function _recurse(value, state, path) {
    paths.push(path);
    if (isJSONArray(value) && isArrayRecursiveState(state) && state.expanded) {
      forEachVisibleIndex(value, state.visibleSections, (index) => {
        _recurse(value[index], state.items[index], path.concat(String(index)));
      });
    }
    if (isJSONObject(value) && isObjectRecursiveState(state) && state.expanded) {
      Object.keys(value).forEach((key) => {
        _recurse(value[key], state.properties[key], path.concat(key));
      });
    }
  }
  _recurse(json, documentState, []);
  return paths;
}
function getPreviousVisiblePath(json, documentState, path) {
  const visiblePaths = getVisiblePaths(json, documentState);
  const visiblePathPointers = visiblePaths.map(compileJSONPointer);
  const pathPointer = compileJSONPointer(path);
  const index = visiblePathPointers.indexOf(pathPointer);
  if (index !== -1 && index > 0) {
    return visiblePaths[index - 1];
  }
  return void 0;
}
function getNextVisiblePath(json, documentState, path) {
  const visiblePaths = getVisiblePaths(json, documentState);
  const visiblePathPointers = visiblePaths.map(compileJSONPointer);
  const index = visiblePathPointers.indexOf(compileJSONPointer(path));
  if (index !== -1 && index < visiblePaths.length - 1) {
    return visiblePaths[index + 1];
  }
  return void 0;
}
function expandSmart(json, documentState, path, maxSize = MAX_DOCUMENT_SIZE_EXPAND_ALL) {
  const nestedJson = getIn(json, path);
  const callback = isLargeContent({ json: nestedJson }, maxSize) ? expandMinimal : expandAll;
  return expandPath(json, documentState, path, callback);
}
function expandSmartIfCollapsed(json, documentState, path) {
  const nestedState = getInRecursiveState(json, documentState, path);
  const isExpanded = isExpandableState(nestedState) ? nestedState.expanded : false;
  return isExpanded ? documentState : expandSmart(json, documentState, path);
}
function expandMinimal(relativePath) {
  return relativePath.length === 0 ? true : relativePath.length === 1 && relativePath[0] === '0';
}
function expandSelf(relativePath) {
  return relativePath.length === 0;
}
function expandAll() {
  return true;
}
function expandNone() {
  return false;
}
function isAfterSelection(selection) {
  return (selection && selection.type === SelectionType.after) || false;
}
function isInsideSelection(selection) {
  return (selection && selection.type === SelectionType.inside) || false;
}
function isKeySelection(selection) {
  return (selection && selection.type === SelectionType.key) || false;
}
function isValueSelection(selection) {
  return (selection && selection.type === SelectionType.value) || false;
}
function isMultiSelection(selection) {
  return (selection && selection.type === SelectionType.multi) || false;
}
function isMultiSelectionWithOneItem(selection) {
  return isMultiSelection(selection) && isEqual(selection.focusPath, selection.anchorPath);
}
function isJSONSelection(selection) {
  return (
    isMultiSelection(selection) ||
    isAfterSelection(selection) ||
    isInsideSelection(selection) ||
    isKeySelection(selection) ||
    isValueSelection(selection)
  );
}
function isTextSelection(selection) {
  return (selection && selection.type === SelectionType.text) || false;
}
function getSelectionPaths(json, selection) {
  const paths = [];
  iterateOverSelection(json, selection, (path) => {
    paths.push(path);
  });
  return paths;
}
function iterateOverSelection(json, selection, callback) {
  if (!selection) {
    return void 0;
  }
  const anchorPath = getAnchorPath(selection);
  const focusPath = getFocusPath(selection);
  if (isEqual(anchorPath, focusPath)) {
    return callback(anchorPath);
  } else {
    if (json === void 0) {
      return void 0;
    }
    const sharedPath = findSharedPath(anchorPath, focusPath);
    if (anchorPath.length === sharedPath.length || focusPath.length === sharedPath.length) {
      return callback(sharedPath);
    }
    const selection2 = createMultiSelection(anchorPath, focusPath);
    const startPath = getStartPath(json, selection2);
    const endPath = getEndPath(json, selection2);
    const startIndex = getChildIndex(json, selection2, startPath);
    const endIndex = getChildIndex(json, selection2, endPath);
    if (startIndex === -1 || endIndex === -1) {
      return void 0;
    }
    const value = getIn(json, sharedPath);
    if (isJSONObject(value)) {
      const keys = Object.keys(value);
      for (let i = startIndex; i <= endIndex; i++) {
        const value2 = callback(sharedPath.concat(keys[i]));
        if (value2 !== void 0) {
          return value2;
        }
      }
      return void 0;
    }
    if (isJSONArray(value)) {
      for (let i = startIndex; i <= endIndex; i++) {
        const value2 = callback(sharedPath.concat(String(i)));
        if (value2 !== void 0) {
          return value2;
        }
      }
      return void 0;
    }
  }
  throw new Error('Failed to create selection');
}
function getParentPath(selection) {
  if (isInsideSelection(selection)) {
    return selection.path;
  } else {
    return initial(getFocusPath(selection));
  }
}
function getStartPath(json, selection) {
  if (!isMultiSelection(selection)) {
    return selection.path;
  }
  const anchorIndex = getChildIndex(json, selection, selection.anchorPath);
  const focusIndex = getChildIndex(json, selection, selection.focusPath);
  return focusIndex < anchorIndex ? selection.focusPath : selection.anchorPath;
}
function getEndPath(json, selection) {
  if (!isMultiSelection(selection)) {
    return selection.path;
  }
  const anchorIndex = getChildIndex(json, selection, selection.anchorPath);
  const focusIndex = getChildIndex(json, selection, selection.focusPath);
  return focusIndex > anchorIndex ? selection.focusPath : selection.anchorPath;
}
function isSelectionInsidePath(selection, path) {
  return (
    pathStartsWith(getFocusPath(selection), path) &&
    (getFocusPath(selection).length > path.length || isInsideSelection(selection))
  );
}
function getSelectionUp(json, documentState, selection, keepAnchorPath = false) {
  if (!selection) {
    return void 0;
  }
  const focusPath = keepAnchorPath ? getFocusPath(selection) : getStartPath(json, selection);
  const previousPath = getPreviousVisiblePath(json, documentState, focusPath);
  if (keepAnchorPath) {
    if (isInsideSelection(selection) || isAfterSelection(selection)) {
      return previousPath !== void 0 ? createMultiSelection(focusPath, focusPath) : void 0;
    }
    return previousPath !== void 0
      ? createMultiSelection(getAnchorPath(selection), previousPath)
      : void 0;
  }
  if (isAfterSelection(selection)) {
    return createValueSelection(focusPath);
  }
  if (isInsideSelection(selection)) {
    return createValueSelection(focusPath);
  }
  if (isKeySelection(selection)) {
    if (previousPath === void 0 || previousPath.length === 0) {
      return void 0;
    }
    const parentPath = initial(previousPath);
    const parent = getIn(json, parentPath);
    if (Array.isArray(parent) || isEmpty(previousPath)) {
      return createValueSelection(previousPath);
    } else {
      return createKeySelection(previousPath);
    }
  }
  if (isValueSelection(selection)) {
    return previousPath !== void 0 ? createValueSelection(previousPath) : void 0;
  }
  if (previousPath !== void 0) {
    return createValueSelection(previousPath);
  }
  return void 0;
}
function getSelectionNextInside(json, documentState, path) {
  const parentPath = initial(path);
  const childPath = [last(path)];
  const parent = getIn(json, parentPath);
  const nextPathInside = parent ? getNextVisiblePath(parent, documentState, childPath) : void 0;
  if (nextPathInside) {
    return createValueSelection(parentPath.concat(nextPathInside));
  } else {
    return createAfterSelection(path);
  }
}
function getInitialSelection(json, documentState) {
  const visiblePaths = getVisiblePaths(json, documentState);
  let index = 0;
  while (
    index < visiblePaths.length - 1 &&
    visiblePaths[index + 1].length > visiblePaths[index].length
  ) {
    index++;
  }
  const path = visiblePaths[index];
  return path === void 0 || path.length === 0 || Array.isArray(getIn(json, initial(path)))
    ? createValueSelection(path)
    : createKeySelection(path);
}
function createSelectionFromOperations(json, operations) {
  if (operations.length === 1) {
    const operation = first(operations);
    if (operation.op === 'replace') {
      const path = parsePath(json, operation.path);
      return createValueSelection(path);
    }
  }
  if (!isEmpty(operations) && operations.every((operation) => operation.op === 'move')) {
    const firstOp = first(operations);
    const otherOps = operations.slice(1);
    if (
      (isJSONPatchCopy(firstOp) || isJSONPatchMove(firstOp)) &&
      firstOp.from !== firstOp.path &&
      otherOps.every((op) => (isJSONPatchCopy(op) || isJSONPatchMove(op)) && op.from === op.path)
    ) {
      const path = parsePath(json, firstOp.path);
      return createKeySelection(path);
    }
  }
  const paths = operations
    .filter((operation) => {
      return (
        operation.op !== 'test' &&
        operation.op !== 'remove' &&
        (operation.op !== 'move' || operation.from !== operation.path) &&
        typeof operation.path === 'string'
      );
    })
    .map((operation) => parsePath(json, operation.path));
  if (isEmpty(paths)) {
    return void 0;
  }
  return {
    type: SelectionType.multi,
    anchorPath: first(paths),
    focusPath: last(paths)
  };
}
function findSharedPath(path1, path2) {
  let i = 0;
  while (i < path1.length && i < path2.length && path1[i] === path2[i]) {
    i++;
  }
  return path1.slice(0, i);
}
function singleItemSelected(selection) {
  return (
    isKeySelection(selection) ||
    isValueSelection(selection) ||
    isMultiSelectionWithOneItem(selection)
  );
}
function findRootPath(json, selection) {
  return singleItemSelected(selection) && isObjectOrArray(getIn(json, getFocusPath(selection)))
    ? getFocusPath(selection)
    : initial(getFocusPath(selection));
}
function pathStartsWith(path, parentPath) {
  if (path.length < parentPath.length) {
    return false;
  }
  for (let i = 0; i < parentPath.length; i++) {
    if (path[i] !== parentPath[i]) {
      return false;
    }
  }
  return true;
}
function removeEditModeFromSelection(selection) {
  if (isEditingSelection(selection)) {
    const { type, path } = selection;
    return { type, path };
  }
  return selection;
}
function createKeySelection(path) {
  return { type: SelectionType.key, path };
}
function createEditKeySelection(path, initialValue) {
  return { type: SelectionType.key, path, edit: true, initialValue };
}
function createValueSelection(path) {
  return { type: SelectionType.value, path };
}
function createEditValueSelection(path, initialValue) {
  return { type: SelectionType.value, path, edit: true, initialValue };
}
function createInsideSelection(path) {
  return {
    type: SelectionType.inside,
    path
  };
}
function createAfterSelection(path) {
  return {
    type: SelectionType.after,
    path
  };
}
function createMultiSelection(anchorPath, focusPath) {
  const sharedPath = findSharedPath(anchorPath, focusPath);
  const isParent = anchorPath.length > sharedPath.length && focusPath.length > sharedPath.length;
  return {
    type: SelectionType.multi,
    anchorPath: isParent ? sharedPath.concat(anchorPath[sharedPath.length]) : sharedPath,
    focusPath: isParent ? sharedPath.concat(focusPath[sharedPath.length]) : sharedPath
  };
}
function selectionToPartialJson(json, selection, indentation, parser) {
  if (isKeySelection(selection)) {
    return String(last(selection.path));
  }
  if (isValueSelection(selection)) {
    const value = getIn(json, selection.path);
    return typeof value === 'string' ? value : parser.stringify(value, null, indentation);
  }
  if (isMultiSelection(selection)) {
    if (isEmpty(selection.focusPath)) {
      return parser.stringify(json, null, indentation);
    }
    const parentPath = getParentPath(selection);
    const parent = getIn(json, parentPath);
    if (Array.isArray(parent)) {
      if (isMultiSelectionWithOneItem(selection)) {
        const item = getIn(json, selection.focusPath);
        return parser.stringify(item, null, indentation);
      } else {
        return getSelectionPaths(json, selection)
          .map((path) => {
            const item = getIn(json, path);
            return `${parser.stringify(item, null, indentation)},`;
          })
          .join('\n');
      }
    } else {
      return getSelectionPaths(json, selection)
        .map((path) => {
          const key = last(path);
          const value = getIn(json, path);
          return `${parser.stringify(key)}: ${parser.stringify(value, null, indentation)},`;
        })
        .join('\n');
    }
  }
  return void 0;
}
function isEditingSelection(selection) {
  return (isKeySelection(selection) || isValueSelection(selection)) && selection.edit === true;
}
function hasSelectionContents(selection) {
  return isKeySelection(selection) || isValueSelection(selection) || isMultiSelection(selection);
}
function canConvert(selection) {
  return (
    isKeySelection(selection) ||
    isValueSelection(selection) ||
    isMultiSelectionWithOneItem(selection)
  );
}
function fromSelectionType(selectionType, path) {
  switch (selectionType) {
    case SelectionType.key:
      return createKeySelection(path);
    case SelectionType.value:
      return createValueSelection(path);
    case SelectionType.after:
      return createAfterSelection(path);
    case SelectionType.inside:
      return createInsideSelection(path);
    case SelectionType.multi:
    case SelectionType.text:
      return createMultiSelection(path, path);
  }
}
function selectionIfOverlapping(json, selection, path) {
  if (!selection) {
    return void 0;
  }
  if (pathInSelection(json, selection, path)) {
    return selection;
  }
  const sharedPath = isMultiSelection(selection) ? initial(selection.focusPath) : selection.path;
  if (pathStartsWith(sharedPath, path)) {
    return selection;
  }
  return void 0;
}
function pathInSelection(json, selection, path) {
  if (json === void 0 || !selection) {
    return false;
  }
  if (isKeySelection(selection) || isInsideSelection(selection) || isAfterSelection(selection)) {
    return isEqual(selection.path, path);
  }
  if (isValueSelection(selection)) {
    return pathStartsWith(path, selection.path);
  }
  if (isMultiSelection(selection)) {
    const startPath = getStartPath(json, selection);
    const endPath = getEndPath(json, selection);
    const parentPath = initial(selection.focusPath);
    if (!pathStartsWith(path, parentPath) || path.length <= parentPath.length) {
      return false;
    }
    const startIndex = getChildIndex(json, selection, startPath);
    const endIndex = getChildIndex(json, selection, endPath);
    const pathIndex = getChildIndex(json, selection, path);
    return pathIndex !== -1 && pathIndex >= startIndex && pathIndex <= endIndex;
  }
  return false;
}
function getChildIndex(json, selection, path) {
  const parentPath = initial(selection.focusPath);
  if (!pathStartsWith(path, parentPath) || path.length <= parentPath.length) {
    return -1;
  }
  const key = path[parentPath.length];
  const parent = getIn(json, parentPath);
  if (isJSONObject(parent)) {
    const keys = Object.keys(parent);
    return keys.indexOf(key);
  }
  if (isJSONArray(parent)) {
    const index = int(key);
    if (index < parent.length) {
      return index;
    }
  }
  return -1;
}
function getFocusPath(selection) {
  return isMultiSelection(selection) ? selection.focusPath : selection.path;
}
function getAnchorPath(selection) {
  return isMultiSelection(selection) ? selection.anchorPath : selection.path;
}
function classnames(...args) {
  const classes = [];
  for (const arg of args) {
    if (typeof arg === 'string') {
      classes.push(arg);
    }
    if (arg && typeof arg === 'object') {
      for (const key in arg) {
        if (Object.hasOwnProperty.call(arg, key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }
  return classes.join(' ');
}
function getValueClass(value, mode, parser) {
  const type = valueType(value, parser);
  return classnames('jse-value', 'jse-' + type, {
    'jse-url': isUrl(value),
    'jse-empty': typeof value === 'string' && value.length === 0,
    'jse-table-cell': mode === Mode.table
  });
}
function EditableDiv($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const debug2 = createDebug('jsoneditor:EditableDiv');
    let value = $$props['value'];
    let initialValue = $$props['initialValue'];
    let shortText = fallback($$props['shortText'], false);
    let label2 = $$props['label'];
    let onChange = $$props['onChange'];
    let onCancel = $$props['onCancel'];
    let onFind = $$props['onFind'];
    let onPaste2 = fallback($$props['onPaste'], noop$3);
    let onValueClass = fallback($$props['onValueClass'], () => '');
    let valueClass;
    let closed = false;
    onDestroy(() => {
      const newValue = getDomValue();
      debug2('onDestroy', { closed, value, newValue });
      if (newValue !== value) {
        onChange(newValue, UpdateSelectionAfterChange.no);
      }
    });
    function getDomValue() {
      {
        return '';
      }
    }
    valueClass = onValueClass(value);
    $$renderer2.push(
      `<div role="textbox"${attr('aria-label', label2)} tabindex="0"${attr_class(clsx$1(classnames('jse-editable-div', valueClass, { 'jse-short-text': shortText })), 'svelte-l4qhpw')} contenteditable="true" spellcheck="false"></div>`
    );
    bind_props($$props, {
      value,
      initialValue,
      shortText,
      label: label2,
      onChange,
      onCancel,
      onFind,
      onPaste: onPaste2,
      onValueClass
    });
  });
}
function EditableValue($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let path = $$props['path'];
    let value = $$props['value'];
    let selection = $$props['selection'];
    let mode = $$props['mode'];
    let parser = $$props['parser'];
    let normalization = $$props['normalization'];
    let enforceString = $$props['enforceString'];
    let onPatch = $$props['onPatch'];
    let onPasteJson = $$props['onPasteJson'];
    let onSelect = $$props['onSelect'];
    let onFind = $$props['onFind'];
    let focus = $$props['focus'];
    let findNextInside = $$props['findNextInside'];
    function convert(value2) {
      return enforceString ? value2 : stringConvert(value2, parser);
    }
    function handleChangeValue(newValue, updateSelection) {
      onPatch(
        [
          {
            op: 'replace',
            path: compileJSONPointer(path),
            value: convert(normalization.unescapeValue(newValue))
          }
        ],
        (_, patchedState, patchedSelection) => {
          if (patchedSelection && !isEqual(path, getFocusPath(patchedSelection))) {
            return void 0;
          }
          const selection2 =
            updateSelection === UpdateSelectionAfterChange.nextInside
              ? findNextInside(path)
              : createValueSelection(path);
          return { state: patchedState, selection: selection2 };
        }
      );
      focus();
    }
    function handleCancelChange() {
      onSelect(createValueSelection(path));
      focus();
    }
    function handlePaste(pastedText) {
      try {
        const pastedJson = parser.parse(pastedText);
        if (isObjectOrArray(pastedJson)) {
          onPasteJson({
            path,
            contents: pastedJson,
            onPasteAsJson: () => {
              handleCancelChange();
              const operations = [
                {
                  op: 'replace',
                  path: compileJSONPointer(path),
                  value: pastedJson
                }
              ];
              onPatch(operations, (patchedJson, patchedState) => ({
                state: expandSmart(patchedJson, patchedState, path)
              }));
            }
          });
        }
      } catch {}
    }
    function handleOnValueClass(value2) {
      return getValueClass(convert(normalization.unescapeValue(value2)), mode, parser);
    }
    EditableDiv($$renderer2, {
      value: normalization.escapeValue(value),
      initialValue: isEditingSelection(selection) ? selection.initialValue : void 0,
      label: 'Edit value',
      onChange: handleChangeValue,
      onCancel: handleCancelChange,
      onPaste: handlePaste,
      onFind,
      onValueClass: handleOnValueClass
    });
    bind_props($$props, {
      path,
      value,
      selection,
      mode,
      parser,
      normalization,
      enforceString,
      onPatch,
      onPasteJson,
      onSelect,
      onFind,
      focus,
      findNextInside
    });
  });
}
function insertBefore(json, path, values) {
  const parentPath = initial(path);
  const parent = getIn(json, parentPath);
  if (isJSONArray(parent)) {
    const offset2 = int(last(path));
    return values.map((entry, index) => ({
      op: 'add',
      path: compileJSONPointer(parentPath.concat(String(offset2 + index))),
      value: entry.value
    }));
  } else if (isJSONObject(parent)) {
    const afterKey = last(path);
    const keys = Object.keys(parent);
    const nextKeys = afterKey !== void 0 ? getNextKeys(keys, afterKey, true) : [];
    return [
      // insert new values
      ...values.map((entry) => {
        const newProp = findUniqueName(entry.key, keys);
        return {
          op: 'add',
          path: compileJSONPointer(parentPath.concat(newProp)),
          value: entry.value
        };
      }),
      // move all lower down keys so the inserted key will maintain its position
      ...nextKeys.map((key) => moveDown(parentPath, key))
    ];
  } else {
    throw new Error('Cannot create insert operations: parent must be an Object or Array');
  }
}
function append(json, path, values) {
  const parent = getIn(json, path);
  if (Array.isArray(parent)) {
    const offset2 = parent.length;
    return values.map((entry, index) => ({
      op: 'add',
      path: compileJSONPointer(path.concat(String(offset2 + index))),
      value: entry.value
    }));
  } else {
    return values.map((entry) => {
      const newProp = findUniqueName(entry.key, Object.keys(parent));
      return {
        op: 'add',
        path: compileJSONPointer(path.concat(newProp)),
        value: entry.value
      };
    });
  }
}
function rename(parentPath, keys, oldKey, newKey) {
  const filteredKeys = keys.filter((key) => key !== oldKey);
  const newKeyUnique = findUniqueName(newKey, filteredKeys);
  const nextKeys = getNextKeys(keys, oldKey, false);
  return [
    // rename a key
    {
      op: 'move',
      from: compileJSONPointer(parentPath.concat(oldKey)),
      path: compileJSONPointer(parentPath.concat(newKeyUnique))
    },
    // move all lower down keys so the renamed key will maintain it's position
    ...nextKeys.map((key) => moveDown(parentPath, key))
  ];
}
function replace(json, paths, values) {
  const firstPath = first(paths);
  const parentPath = initial(firstPath);
  const parent = getIn(json, parentPath);
  if (isJSONArray(parent)) {
    const firstPath2 = first(paths);
    const offset2 = firstPath2 ? int(last(firstPath2)) : 0;
    return [
      // remove operations
      ...removeAll(paths),
      // insert operations
      ...values.map((entry, index) => {
        const operation = {
          op: 'add',
          path: compileJSONPointer(parentPath.concat(String(index + offset2))),
          value: entry.value
        };
        return operation;
      })
    ];
  } else if (isJSONObject(parent)) {
    const lastPath = last(paths);
    const parentPath2 = initial(lastPath);
    const beforeKey = last(lastPath);
    const keys = Object.keys(parent);
    const nextKeys = beforeKey !== void 0 ? getNextKeys(keys, beforeKey, false) : [];
    const removeKeys = new Set(paths.map((path) => last(path)));
    const filteredKeys = keys.filter((key) => !removeKeys.has(key));
    return [
      // remove operations
      ...removeAll(paths),
      // insert operations
      ...values.map((entry) => {
        const newProp = findUniqueName(entry.key, filteredKeys);
        return {
          op: 'add',
          path: compileJSONPointer(parentPath2.concat(newProp)),
          value: entry.value
        };
      }),
      // move down operations
      // move all lower down keys so the renamed key will maintain its position
      ...nextKeys.map((key) => moveDown(parentPath2, key))
    ];
  } else {
    throw new Error('Cannot create replace operations: parent must be an Object or Array');
  }
}
function duplicate(json, paths) {
  const lastPath = last(paths);
  if (isEmpty(lastPath)) {
    throw new Error('Cannot duplicate root object');
  }
  const parentPath = initial(lastPath);
  const beforeKey = last(lastPath);
  const parent = getIn(json, parentPath);
  if (isJSONArray(parent)) {
    const lastPath2 = last(paths);
    const offset2 = lastPath2 ? int(last(lastPath2)) + 1 : 0;
    return [
      // copy operations
      ...paths.map((path, index) => {
        const operation = {
          op: 'copy',
          from: compileJSONPointer(path),
          path: compileJSONPointer(parentPath.concat(String(index + offset2)))
        };
        return operation;
      })
    ];
  } else if (isJSONObject(parent)) {
    const keys = Object.keys(parent);
    const nextKeys = beforeKey !== void 0 ? getNextKeys(keys, beforeKey, false) : [];
    return [
      // copy operations
      ...paths.map((path) => {
        const prop = last(path);
        const newProp = findUniqueName(prop, keys);
        return {
          op: 'copy',
          from: compileJSONPointer(path),
          path: compileJSONPointer(parentPath.concat(newProp))
        };
      }),
      // move down operations
      // move all lower down keys so the renamed key will maintain it's position
      ...nextKeys.map((key) => moveDown(parentPath, key))
    ];
  } else {
    throw new Error('Cannot create duplicate operations: parent must be an Object or Array');
  }
}
function extract(json, selection) {
  if (isValueSelection(selection)) {
    return [
      {
        op: 'move',
        from: compileJSONPointer(selection.path),
        path: ''
      }
    ];
  }
  if (isMultiSelection(selection)) {
    const parentPath = initial(selection.focusPath);
    const parent = getIn(json, parentPath);
    if (isJSONArray(parent)) {
      const value = getSelectionPaths(json, selection).map((path) => {
        const index = int(last(path));
        return parent[index];
      });
      return [
        {
          op: 'replace',
          path: '',
          value
        }
      ];
    } else if (isJSONObject(parent)) {
      const value = {};
      getSelectionPaths(json, selection).forEach((path) => {
        const key = String(last(path));
        value[key] = parent[key];
      });
      return [
        {
          op: 'replace',
          path: '',
          value
        }
      ];
    }
  } else {
    throw new Error('Cannot create extract operations: parent must be an Object or Array');
  }
  throw new Error('Cannot extract: unsupported type of selection ' + JSON.stringify(selection));
}
function insert(json, selection, clipboardText, parser) {
  if (isKeySelection(selection)) {
    const clipboard = parseAndRepairOrUndefined(clipboardText, parser);
    const parentPath = initial(selection.path);
    const parent = getIn(json, parentPath);
    const keys = Object.keys(parent);
    const oldKey = last(selection.path);
    const newKey = typeof clipboard === 'string' ? clipboard : clipboardText;
    return rename(parentPath, keys, oldKey, newKey);
  }
  if (
    isValueSelection(selection) ||
    (isMultiSelection(selection) && isEmpty(selection.focusPath))
  ) {
    try {
      return [
        {
          op: 'replace',
          path: compileJSONPointer(getFocusPath(selection)),
          value: parsePartialJson(clipboardText, (text) => parseAndRepair(text, parser))
        }
      ];
    } catch {
      return [
        {
          op: 'replace',
          path: compileJSONPointer(getFocusPath(selection)),
          value: clipboardText
        }
      ];
    }
  }
  if (isMultiSelection(selection)) {
    const newValues = clipboardToValues(clipboardText, parser);
    return replace(json, getSelectionPaths(json, selection), newValues);
  }
  if (isAfterSelection(selection)) {
    const newValues = clipboardToValues(clipboardText, parser);
    const path = selection.path;
    const parentPath = initial(path);
    const parent = getIn(json, parentPath);
    if (isJSONArray(parent)) {
      const index = int(last(path));
      const nextItemPath = parentPath.concat(String(index + 1));
      return insertBefore(json, nextItemPath, newValues);
    } else if (isJSONObject(parent)) {
      const key = String(last(path));
      const keys = Object.keys(parent);
      if (isEmpty(keys) || last(keys) === key) {
        return append(json, parentPath, newValues);
      } else {
        const index = keys.indexOf(key);
        const nextKey = keys[index + 1];
        const nextKeyPath = parentPath.concat(nextKey);
        return insertBefore(json, nextKeyPath, newValues);
      }
    } else {
      throw new Error('Cannot create insert operations: parent must be an Object or Array');
    }
  }
  if (isInsideSelection(selection)) {
    const newValues = clipboardToValues(clipboardText, parser);
    const path = selection.path;
    const value = getIn(json, path);
    if (isJSONArray(value)) {
      const firstItemPath = path.concat('0');
      return insertBefore(json, firstItemPath, newValues);
    } else if (isJSONObject(value)) {
      const keys = Object.keys(value);
      if (isEmpty(keys)) {
        return append(json, path, newValues);
      } else {
        const firstKey = first(keys);
        const firstKeyPath = path.concat(firstKey);
        return insertBefore(json, firstKeyPath, newValues);
      }
    } else {
      throw new Error('Cannot create insert operations: parent must be an Object or Array');
    }
  }
  throw new Error('Cannot insert: unsupported type of selection ' + JSON.stringify(selection));
}
function moveInsideParent(json, selection, dragInsideAction) {
  if (!selection) {
    return [];
  }
  const beforePath = 'beforePath' in dragInsideAction ? dragInsideAction['beforePath'] : void 0;
  const append2 = 'append' in dragInsideAction ? dragInsideAction['append'] : void 0;
  const parentPath = initial(getFocusPath(selection));
  const parent = getIn(json, parentPath);
  if (
    !append2 &&
    !(beforePath && pathStartsWith(beforePath, parentPath) && beforePath.length > parentPath.length)
  ) {
    return [];
  }
  const startPath = getStartPath(json, selection);
  const endPath = getEndPath(json, selection);
  const startKey = last(startPath);
  const endKey = last(endPath);
  const toKey = beforePath ? beforePath[parentPath.length] : void 0;
  if (isJSONObject(parent)) {
    const keys = Object.keys(parent);
    const startIndex = keys.indexOf(startKey);
    const endIndex = keys.indexOf(endKey);
    const toIndex = append2 ? keys.length : toKey !== void 0 ? keys.indexOf(toKey) : -1;
    if (startIndex !== -1 && endIndex !== -1 && toIndex !== -1) {
      if (toIndex > startIndex) {
        return [...keys.slice(startIndex, endIndex + 1), ...keys.slice(toIndex, keys.length)].map(
          (key) => moveDown(parentPath, key)
        );
      } else {
        return [...keys.slice(toIndex, startIndex), ...keys.slice(endIndex + 1, keys.length)].map(
          (key) => moveDown(parentPath, key)
        );
      }
    }
  } else if (isJSONArray(parent)) {
    const startIndex = int(startKey);
    const endIndex = int(endKey);
    const toIndex = toKey !== void 0 ? int(toKey) : parent.length;
    const count = endIndex - startIndex + 1;
    if (toIndex < startIndex) {
      return times(count, (offset2) => {
        return {
          op: 'move',
          from: compileJSONPointer(parentPath.concat(String(startIndex + offset2))),
          path: compileJSONPointer(parentPath.concat(String(toIndex + offset2)))
        };
      });
    } else {
      return times(count, () => {
        return {
          op: 'move',
          from: compileJSONPointer(parentPath.concat(String(startIndex))),
          path: compileJSONPointer(parentPath.concat(String(toIndex)))
        };
      });
    }
  } else {
    throw new Error('Cannot create move operations: parent must be an Object or Array');
  }
  return [];
}
function createNewValue(json, selection, valueType2) {
  if (valueType2 === 'object') {
    return {};
  }
  if (valueType2 === 'array') {
    return [];
  }
  if (valueType2 === 'structure' && json !== void 0) {
    const parentPath = selection ? getParentPath(selection) : [];
    const parent = getIn(json, parentPath);
    if (Array.isArray(parent) && !isEmpty(parent)) {
      const jsonExample = first(parent);
      if (isObjectOrArray(jsonExample)) {
        return cloneDeepWith(jsonExample, (value) => {
          return Array.isArray(value) ? [] : isObject$1(value) ? void 0 : '';
        });
      } else {
        return '';
      }
    }
  }
  return '';
}
function removeAll(paths) {
  return paths
    .map((path) => {
      const operation = {
        op: 'remove',
        path: compileJSONPointer(path)
      };
      return operation;
    })
    .reverse();
}
function moveDown(parentPath, key) {
  return {
    op: 'move',
    from: compileJSONPointer(parentPath.concat(key)),
    path: compileJSONPointer(parentPath.concat(key))
  };
}
function clipboardToValues(clipboardText, parser) {
  const textIsObject = /^\s*{/.test(clipboardText);
  const textIsArray = /^\s*\[/.test(clipboardText);
  const clipboardOriginal = parseAndRepairOrUndefined(clipboardText, parser);
  const clipboardRepaired =
    clipboardOriginal !== void 0
      ? clipboardOriginal
      : parsePartialJson(clipboardText, (text) => parseAndRepair(text, parser));
  if (
    (textIsObject && isObject$1(clipboardRepaired)) ||
    (textIsArray && Array.isArray(clipboardRepaired))
  ) {
    return [{ key: 'New item', value: clipboardRepaired }];
  }
  if (Array.isArray(clipboardRepaired)) {
    return clipboardRepaired.map((value, index) => {
      return { key: 'New item ' + index, value };
    });
  }
  if (isObject$1(clipboardRepaired)) {
    return Object.keys(clipboardRepaired).map((key) => {
      return { key, value: clipboardRepaired[key] };
    });
  }
  return [{ key: 'New item', value: clipboardRepaired }];
}
function createRemoveOperations(json, selection) {
  if (isKeySelection(selection)) {
    const parentPath = initial(selection.path);
    const parent = getIn(json, parentPath);
    const keys = Object.keys(parent);
    const oldKey = last(selection.path);
    const newKey = '';
    const operations = rename(parentPath, keys, oldKey, newKey);
    const newSelection = createSelectionFromOperations(json, operations);
    return { operations, newSelection };
  }
  if (isValueSelection(selection)) {
    const operations = [
      {
        op: 'replace',
        path: compileJSONPointer(selection.path),
        value: ''
      }
    ];
    return { operations, newSelection: selection };
  }
  if (isMultiSelection(selection)) {
    const paths = getSelectionPaths(json, selection);
    const operations = removeAll(paths);
    const lastPath = last(paths);
    if (isEmpty(lastPath)) {
      const operations2 = [{ op: 'replace', path: '', value: '' }];
      const newSelection = createValueSelection([]);
      return { operations: operations2, newSelection };
    }
    const parentPath = initial(lastPath);
    const parent = getIn(json, parentPath);
    if (isJSONArray(parent)) {
      const firstPath = first(paths);
      const index = int(last(firstPath));
      const newSelection =
        index === 0
          ? createInsideSelection(parentPath)
          : createAfterSelection(parentPath.concat(String(index - 1)));
      return { operations, newSelection };
    } else if (isJSONObject(parent)) {
      const keys = Object.keys(parent);
      const firstPath = first(paths);
      const key = last(firstPath);
      const index = keys.indexOf(key);
      const previousKey = keys[index - 1];
      const newSelection =
        index === 0
          ? createInsideSelection(parentPath)
          : createAfterSelection(parentPath.concat(previousKey));
      return { operations, newSelection };
    } else {
      throw new Error('Cannot create remove operations: parent must be an Object or Array');
    }
  }
  throw new Error('Cannot remove: unsupported type of selection ' + JSON.stringify(selection));
}
function revertJSONPatchWithMoveOperations(json, operations) {
  const filteredOperations = _filterRedundantMoveOperations(json, operations);
  return revertJSONPatch(json, filteredOperations, {
    before: (json2, operation, revertOperations) => {
      if (isJSONPatchRemove(operation)) {
        const path = parseJSONPointer(operation.path);
        return {
          revertOperations: [...revertOperations, ...createRevertMoveOperations(json2, path)]
        };
      }
      if (isJSONPatchMove(operation)) {
        const from = parseJSONPointer(operation.from);
        return {
          revertOperations:
            operation.from === operation.path
              ? [operation, ...createRevertMoveOperations(json2, from)]
              : [...revertOperations, ...createRevertMoveOperations(json2, from)]
        };
      }
      return { document: json2 };
    }
  });
}
function _filterRedundantMoveOperations(json, operations) {
  if (isEmpty(operations) || !operations.every(isJSONPatchMove)) {
    return operations;
  }
  const processedOps = [];
  for (const operation of operations) {
    const from = splitParentKey(parseJSONPointer(operation.from));
    const path = splitParentKey(parseJSONPointer(operation.path));
    if (!from || !path) {
      return operations;
    }
    processedOps.push({ from, path, operation });
  }
  const parentPath = processedOps[0].path.parent;
  const parent = getIn(json, parentPath);
  if (!isJSONObject(parent)) {
    return operations;
  }
  if (!processedOps.every((op) => _equalParentPath(op, parentPath))) {
    return operations;
  }
  const firstKey = _findKeyWithLowestKeyIndex(processedOps, json);
  const getOperation = (op) => op.operation;
  const renameOps = processedOps.filter((op) => op.operation.from !== op.operation.path);
  return renameOps.some((op) => op.path.key === firstKey)
    ? renameOps.map(getOperation)
    : [moveDown(parentPath, firstKey), ...renameOps.map(getOperation)];
}
function splitParentKey(path) {
  return path.length > 0 ? { parent: initial(path), key: last(path) } : void 0;
}
function _equalParentPath(operation, parentPath) {
  return isEqual(operation.from.parent, parentPath) && isEqual(operation.path.parent, parentPath);
}
function _findKeyWithLowestKeyIndex(processedOps, json) {
  const keys = Object.keys(json);
  const movedKeys = keys.slice();
  for (const op of processedOps) {
    const index = movedKeys.indexOf(op.from.key);
    if (index !== -1) {
      movedKeys.splice(index, 1);
      movedKeys.push(op.path.key);
    }
  }
  let i = 0;
  while (i < keys.length && keys[i] === movedKeys[i]) {
    i++;
  }
  return movedKeys[i];
}
function createRevertMoveOperations(json, path) {
  const parentPath = initial(path);
  const afterKey = last(path);
  const parent = getIn(json, parentPath);
  if (isJSONObject(parent)) {
    const keys = Object.keys(parent);
    const nextKeys = getNextKeys(keys, afterKey, false);
    return nextKeys.map((key) => moveDown(parentPath, key));
  }
  return [];
}
function createNestedValueOperations(operations, json) {
  return operations.flatMap((operation) => {
    if (isJSONPatchReplace(operation)) {
      const path = parseJSONPointer(operation.path);
      if (path.length > 0) {
        const extendedOperations = [operation];
        let parentPath = initial(path);
        while (parentPath.length > 0 && !existsIn(json, parentPath)) {
          extendedOperations.unshift({
            op: 'add',
            path: compileJSONPointer(parentPath),
            value: {}
          });
          parentPath = initial(parentPath);
        }
        return extendedOperations;
      }
    }
    return operation;
  });
}
function updateSearchResult(newResultItems, previousResult) {
  const activePath = previousResult?.activeItem
    ? getSearchResultPath(previousResult.activeItem)
    : void 0;
  const matchingActiveIndex = newResultItems.findIndex((item) => {
    return isEqual(activePath, getSearchResultPath(item));
  });
  const activeIndex =
    matchingActiveIndex !== -1
      ? matchingActiveIndex
      : previousResult?.activeIndex !== void 0 &&
          previousResult?.activeIndex < newResultItems.length
        ? previousResult?.activeIndex
        : newResultItems.length > 0
          ? 0
          : -1;
  const items = newResultItems.map((item, resultIndex) => {
    return { resultIndex, ...item, active: resultIndex === activeIndex };
  });
  const activeItem = items[activeIndex];
  return {
    items,
    activeItem,
    activeIndex
  };
}
function search(searchText, json, options = {}) {
  const searchTextLowerCase = searchText.toLowerCase();
  const maxResults = options?.maxResults ?? Infinity;
  const columns = options?.columns;
  const results = [];
  const path = [];
  function onMatch(match) {
    if (results.length >= maxResults) {
      return;
    }
    results.push(match);
  }
  function searchRecursive(searchTextLowerCase2, value) {
    if (isJSONArray(value)) {
      const level = path.length;
      path.push('0');
      for (let i = 0; i < value.length; i++) {
        path[level] = String(i);
        searchRecursive(searchTextLowerCase2, value[i]);
        if (results.length >= maxResults) {
          return;
        }
      }
      path.pop();
    } else if (isJSONObject(value)) {
      const keys = Object.keys(value);
      const level = path.length;
      path.push('');
      for (const key of keys) {
        path[level] = key;
        findCaseInsensitiveMatches(key, searchTextLowerCase2, path, SearchField.key, onMatch);
        searchRecursive(searchTextLowerCase2, value[key]);
        if (results.length >= maxResults) {
          return;
        }
      }
      path.pop();
    } else {
      findCaseInsensitiveMatches(
        String(value),
        searchTextLowerCase2,
        path,
        SearchField.value,
        onMatch
      );
    }
  }
  if (searchText === '') {
    return [];
  } else if (columns) {
    if (!Array.isArray(json)) {
      throw new Error('json must be an Array when option columns is defined');
    }
    for (let i = 0; i < json.length; i++) {
      path[0] = String(i);
      const item = json[i];
      for (let c = 0; c < columns.length; c++) {
        const column = columns[c];
        if (column.length === 1) {
          path[1] = column[0];
        } else {
          for (let p = 0; p < column.length; p++) {
            path[p + 1] = column[p];
          }
        }
        while (path.length > column.length + 1) {
          path.pop();
        }
        const value = getIn(item, column);
        searchRecursive(searchTextLowerCase, value);
      }
      if (results.length >= maxResults) {
        break;
      }
    }
    return results;
  } else {
    searchRecursive(searchTextLowerCase, json);
    return results;
  }
}
function findCaseInsensitiveMatches(text, searchTextLowerCase, path, field, onMatch) {
  const textLower = text.toLowerCase();
  let fieldIndex = 0;
  let position = -1;
  let index = -1;
  do {
    index = textLower.indexOf(searchTextLowerCase, position);
    if (index !== -1) {
      position = index + searchTextLowerCase.length;
      onMatch({
        path: path.slice(0),
        // path may be mutated in a later stage, therefore we store a copy
        field,
        fieldIndex,
        start: index,
        end: position
      });
      fieldIndex++;
    }
  } while (index !== -1);
}
function splitValue(text, matches) {
  const parts = [];
  let previousEnd = 0;
  for (const match of matches) {
    const precedingText = text.slice(previousEnd, match.start);
    if (precedingText !== '') {
      parts.push({
        resultIndex: void 0,
        type: 'normal',
        text: precedingText,
        active: false
      });
    }
    const matchingText = text.slice(match.start, match.end);
    parts.push({
      resultIndex: match.resultIndex,
      type: 'highlight',
      text: matchingText,
      active: match.active
    });
    previousEnd = match.end;
  }
  const lastMatch = last(matches);
  if (lastMatch && lastMatch.end < text.length) {
    parts.push({
      type: 'normal',
      text: text.slice(lastMatch.end),
      resultIndex: void 0,
      active: false
    });
  }
  return parts;
}
function getSearchResultPath(searchResultItem) {
  return searchResultItem.path.concat(searchResultItem.field, String(searchResultItem.fieldIndex));
}
function filterKeySearchResults(searchResult) {
  const filtered = hasSearchResults(searchResult)
    ? searchResult.searchResults.filter((result) => result.field === SearchField.key)
    : void 0;
  return filtered && filtered.length > 0 ? filtered : void 0;
}
function filterValueSearchResults(searchResult) {
  const filtered = hasSearchResults(searchResult)
    ? searchResult.searchResults.filter((result) => result.field === SearchField.value)
    : void 0;
  return filtered && filtered.length > 0 ? filtered : void 0;
}
const searchResultsFactory = {
  createObjectDocumentState: () => ({ type: 'object', properties: {} }),
  createArrayDocumentState: () => ({ type: 'array', items: [] }),
  createValueDocumentState: () => ({ type: 'value' })
};
function updateInSearchResults(json, searchResults, path, transform) {
  return updateInRecursiveState(json, searchResults, path, transform, searchResultsFactory);
}
function toRecursiveSearchResults(json, searchResultItems) {
  return searchResultItems.reduce(
    (recursiveState, searchResult) => {
      return updateInSearchResults(json, recursiveState, searchResult.path, (_, nestedState) => ({
        ...nestedState,
        searchResults: nestedState.searchResults
          ? nestedState.searchResults.concat(searchResult)
          : [searchResult]
      }));
    },
    void 0
  );
}
function flattenSearchResults(node) {
  const self = node?.searchResults ?? [];
  const nested = isObjectRecursiveState(node)
    ? Object.values(node.properties).flatMap(flattenSearchResults)
    : isArrayRecursiveState(node)
      ? node.items.flatMap(flattenSearchResults)
      : [];
  return self.concat(nested);
}
function SearchResultHighlighter($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let parts;
    let text = $$props['text'];
    let searchResultItems = $$props['searchResultItems'];
    parts = splitValue(String(text), searchResultItems);
    $$renderer2.push(`<!--[-->`);
    const each_array = ensure_array_like(parts);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let part = each_array[$$index];
      if (part.type === 'normal') {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`${escape_html(part.text)}`);
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `<span${attr_class('jse-highlight svelte-xeh62o', void 0, { 'jse-active': part.active })}${attr('data-search-result-index', String(part.resultIndex))}>${escape_html(addNewLineSuffix(part.text))}</span>`
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { text, searchResultItems });
  });
}
function formatSize(size) {
  const kilo = 1e3;
  const factor = 0.9;
  if (size < factor * kilo) {
    return size.toFixed() + ' B';
  }
  const KB = size / kilo;
  if (KB < factor * kilo) {
    return KB.toFixed(1) + ' KB';
  }
  const MB = KB / kilo;
  if (MB < factor * kilo) {
    return MB.toFixed(1) + ' MB';
  }
  const GB = MB / kilo;
  if (GB < factor * kilo) {
    return GB.toFixed(1) + ' GB';
  }
  const TB = GB / kilo;
  return TB.toFixed(1) + ' TB';
}
function Tag($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const { onclick, children } = $$props;
    $$renderer2.push(
      `<button type="button"${attr_class('jse-tag svelte-txvf7b', void 0, { disabled: !onclick })}>`
    );
    children?.($$renderer2);
    $$renderer2.push(`<!----></button>`);
  });
}
function ReadonlyValue($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const {
      path,
      value,
      mode,
      truncateTextSize,
      readOnly,
      normalization,
      parser,
      onSelect,
      searchResultItems
    } = $$props;
    let doTruncate = true;
    const isTruncated =
      doTruncate &&
      typeof value === 'string' &&
      value.length > truncateTextSize &&
      (!searchResultItems ||
        !searchResultItems.some((item) => item.active && item.end > truncateTextSize));
    const truncatedValue =
      isTruncated && typeof value === 'string'
        ? value.substring(0, truncateTextSize).trim()
        : value;
    const valueIsUrl = isUrl(value);
    function handleShowMore() {
      doTruncate = false;
    }
    $$renderer2.push(
      `<div role="button" tabindex="-1" data-type="selectable-value"${attr_class(clsx$1(getValueClass(value, mode, parser)), 'svelte-1osa8zi')}${attr('title', valueIsUrl ? 'Ctrl+Click or Ctrl+Enter to open url in new window' : void 0)}>`
    );
    if (searchResultItems) {
      $$renderer2.push('<!--[-->');
      SearchResultHighlighter($$renderer2, {
        text: normalization.escapeValue(truncatedValue),
        searchResultItems
      });
    } else {
      $$renderer2.push('<!--[!-->');
      $$renderer2.push(
        `${escape_html(addNewLineSuffix(normalization.escapeValue(truncatedValue)))}`
      );
    }
    $$renderer2.push(`<!--]--> `);
    if (isTruncated && typeof value === 'string') {
      $$renderer2.push('<!--[-->');
      Tag($$renderer2, {
        onclick: handleShowMore,
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Show more (${escape_html(formatSize(value.length))})`);
        }
      });
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function TimestampTag($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    getContext('absolute-popup');
    let value = $$props['value'];
    `Time: ${new Date(value).toString()}`;
    $$renderer2.push(`<div class="jse-timestamp svelte-1eo5fkn">`);
    Icon($$renderer2, { data: faClock });
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { value });
  });
}
function renderValue(props) {
  const renderers = [];
  if (!props.isEditing && isBoolean(props.value)) {
    renderers.push({ component: BooleanToggle, props });
  }
  if (!props.isEditing && isColor(props.value)) {
    renderers.push({ component: ColorPicker, props });
  }
  if (props.isEditing) {
    renderers.push({ component: EditableValue, props });
  }
  if (!props.isEditing) {
    renderers.push({ component: ReadonlyValue, props });
  }
  if (!props.isEditing && isTimestamp(props.value)) {
    renderers.push({ component: TimestampTag, props });
  }
  return renderers;
}
function stringifyJSONPath(path) {
  return path
    .map((p, index) => {
      return integerNumberRegex.test(p)
        ? '[' + p + ']'
        : /[.[\]]/.test(p) || p === ''
          ? '["' + escapeQuotes(p) + '"]'
          : (index > 0 ? '.' : '') + p;
    })
    .join('');
}
function escapeQuotes(prop) {
  return prop.replace(/"/g, '\\"');
}
function parseJSONPath(pathStr) {
  const path = [];
  let i = 0;
  while (i < pathStr.length) {
    if (pathStr[i] === '.') {
      i++;
    }
    if (pathStr[i] === '[') {
      i++;
      if (pathStr[i] === '"') {
        i++;
        path.push(parseProp((c) => c === '"', true));
        eatCharacter('"');
      } else {
        path.push(parseProp((c) => c === ']'));
      }
      eatCharacter(']');
    } else {
      path.push(parseProp((c) => c === '.' || c === '['));
    }
  }
  function parseProp(isEnd, unescape = false) {
    let prop = '';
    while (i < pathStr.length && !isEnd(pathStr[i])) {
      if (unescape && pathStr[i] === '\\' && pathStr[i + 1] === '"') {
        prop += '"';
        i += 2;
      } else {
        prop += pathStr[i];
        i++;
      }
    }
    return prop;
  }
  function eatCharacter(char) {
    if (pathStr[i] !== char) {
      throw new SyntaxError(`Invalid JSON path: ${char} expected at position ${i}`);
    }
    i++;
  }
  return path;
}
function pathToOption(path) {
  return {
    value: path,
    label: isEmpty(path) ? '(item root)' : stringifyJSONPath(path)
  };
}
const integerNumberRegex = /^\d+$/;
const transformModalStates = {};
function createFloatingActions(initOptions) {
  let referenceElement;
  let floatingElement;
  const defaultOptions = {
    autoUpdate: true
  };
  let options = initOptions;
  const getOptions = (mixin) => {
    return { ...defaultOptions, ...(initOptions || {}), ...(mixin || {}) };
  };
  const updatePosition = (updateOptions) => {
    if (referenceElement && floatingElement) {
      options = getOptions(updateOptions);
      computePosition(referenceElement, floatingElement, options).then((v) => {
        Object.assign(floatingElement.style, {
          position: v.strategy,
          left: `${v.x}px`,
          top: `${v.y}px`
        });
        options?.onComputed && options.onComputed(v);
      });
    }
  };
  const referenceAction = (node) => {
    if ('subscribe' in node) {
      setupVirtualElementObserver(node);
      return {};
    } else {
      referenceElement = node;
      updatePosition();
    }
  };
  const contentAction = (node, contentOptions) => {
    let autoUpdateDestroy;
    floatingElement = node;
    options = getOptions(contentOptions);
    setTimeout(() => updatePosition(contentOptions), 0);
    updatePosition(contentOptions);
    const destroyAutoUpdate = () => {
      if (autoUpdateDestroy) {
        autoUpdateDestroy();
        autoUpdateDestroy = void 0;
      }
    };
    const initAutoUpdate = ({ autoUpdate: autoUpdate$1 } = options || {}) => {
      destroyAutoUpdate();
      if (autoUpdate$1 !== false) {
        tick().then(() => {
          return autoUpdate(
            referenceElement,
            floatingElement,
            () => updatePosition(options),
            autoUpdate$1 === true ? {} : autoUpdate$1
          );
        });
      }
      return;
    };
    autoUpdateDestroy = initAutoUpdate();
    return {
      update(contentOptions2) {
        updatePosition(contentOptions2);
        autoUpdateDestroy = initAutoUpdate(contentOptions2);
      },
      destroy() {
        destroyAutoUpdate();
      }
    };
  };
  const setupVirtualElementObserver = (node) => {
    const unsubscribe = node.subscribe(($node) => {
      if (referenceElement === void 0) {
        referenceElement = $node;
        updatePosition();
      } else {
        Object.assign(referenceElement, $node);
        updatePosition();
      }
    });
    onDestroy(unsubscribe);
  };
  return [referenceAction, contentAction, updatePosition];
}
function filter({
  loadOptions,
  filterText,
  items,
  multiple,
  value,
  itemId,
  groupBy: groupBy2,
  filterSelectedItems,
  itemFilter,
  convertStringItemsToObjects,
  filterGroupedItems,
  label: label2
}) {
  if (items && loadOptions) return items;
  if (!items) return [];
  if (items && items.length > 0 && typeof items[0] !== 'object') {
    items = convertStringItemsToObjects(items);
  }
  let filterResults = items.filter((item) => {
    let matchesFilter = itemFilter(item[label2], filterText, item);
    if (matchesFilter && multiple && value?.length) {
      matchesFilter = !value.some((x) => {
        return filterSelectedItems ? x[itemId] === item[itemId] : false;
      });
    }
    return matchesFilter;
  });
  if (groupBy2) {
    filterResults = filterGroupedItems(filterResults);
  }
  return filterResults;
}
async function getItems({ dispatch, loadOptions, convertStringItemsToObjects, filterText }) {
  let res = await loadOptions(filterText).catch((err) => {
    console.warn('svelte-select loadOptions error :>> ', err);
    dispatch('error', { type: 'loadOptions', details: err });
  });
  if (res && !res.cancelled) {
    if (res) {
      if (res && res.length > 0 && typeof res[0] !== 'object') {
        res = convertStringItemsToObjects(res);
      }
      dispatch('loaded', { items: res });
    } else {
      res = [];
    }
    return {
      filteredItems: res,
      loading: false,
      focused: true,
      listOpen: true
    };
  }
}
function ChevronIcon($$renderer) {
  $$renderer.push(`<svg width="100%" height="100%" viewBox="0 0 20 20" focusable="false" aria-hidden="true" class="svelte-1kxu7be"><path fill="currentColor" d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747
          3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0
          1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502
          0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0
          0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg>`);
}
function ClearIcon($$renderer) {
  $$renderer.push(`<svg width="100%" height="100%" viewBox="-2 -2 50 50" focusable="false" aria-hidden="true" role="presentation" class="svelte-1hraxrc"><path fill="currentColor" d="M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124
    l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z"></path></svg>`);
}
function LoadingIcon($$renderer) {
  $$renderer.push(
    `<svg class="loading svelte-y9fi5p" viewBox="25 25 50 50"><circle class="circle_path svelte-y9fi5p" cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-miterlimit="10"></circle></svg>`
  );
}
function Select($$renderer, $$props) {
  const $$slots = sanitize_slots($$props);
  $$renderer.component(($$renderer2) => {
    let filteredItems,
      hasValue,
      hideSelectedItem,
      showClear,
      placeholderText,
      ariaSelection,
      ariaContext;
    const dispatch = createEventDispatcher();
    let justValue = fallback($$props['justValue'], null);
    let filter$1 = fallback($$props['filter'], filter);
    let getItems$1 = fallback($$props['getItems'], getItems);
    let id2 = fallback($$props['id'], null);
    let name = fallback($$props['name'], null);
    let container = fallback($$props['container'], void 0);
    let input = fallback($$props['input'], void 0);
    let multiple = fallback($$props['multiple'], false);
    let multiFullItemClearable = fallback($$props['multiFullItemClearable'], false);
    let disabled = fallback($$props['disabled'], false);
    let focused = fallback($$props['focused'], false);
    let value = fallback($$props['value'], null);
    let filterText = fallback($$props['filterText'], '');
    let placeholder = fallback($$props['placeholder'], 'Please select');
    let placeholderAlwaysShow = fallback($$props['placeholderAlwaysShow'], false);
    let items = fallback($$props['items'], null);
    let label2 = fallback($$props['label'], 'label');
    let itemFilter = fallback($$props['itemFilter'], (label3, filterText2, option) =>
      `${label3}`.toLowerCase().includes(filterText2.toLowerCase())
    );
    let groupBy2 = fallback($$props['groupBy'], void 0);
    let groupFilter = fallback($$props['groupFilter'], (groups) => groups);
    let groupHeaderSelectable = fallback($$props['groupHeaderSelectable'], false);
    let itemId = fallback($$props['itemId'], 'value');
    let loadOptions = fallback($$props['loadOptions'], void 0);
    let containerStyles = fallback($$props['containerStyles'], '');
    let hasError = fallback($$props['hasError'], false);
    let filterSelectedItems = fallback($$props['filterSelectedItems'], true);
    let required = fallback($$props['required'], false);
    let closeListOnChange = fallback($$props['closeListOnChange'], true);
    let clearFilterTextOnBlur = fallback($$props['clearFilterTextOnBlur'], true);
    let createGroupHeaderItem = fallback($$props['createGroupHeaderItem'], (groupValue, item) => {
      return { value: groupValue, [label2]: groupValue };
    });
    const getFilteredItems = () => {
      return filteredItems;
    };
    let searchable = fallback($$props['searchable'], true);
    let inputStyles = fallback($$props['inputStyles'], '');
    let clearable = fallback($$props['clearable'], true);
    let loading = fallback($$props['loading'], false);
    let listOpen = fallback($$props['listOpen'], false);
    let timeout;
    let debounce2 = fallback($$props['debounce'], (fn, wait = 1) => {
      clearTimeout(timeout);
      timeout = setTimeout(fn, wait);
    });
    let debounceWait = fallback($$props['debounceWait'], 300);
    let hideEmptyState = fallback($$props['hideEmptyState'], false);
    let inputAttributes = fallback($$props['inputAttributes'], () => ({}), true);
    let listAutoWidth = fallback($$props['listAutoWidth'], true);
    let showChevron = fallback($$props['showChevron'], false);
    let listOffset = fallback($$props['listOffset'], 5);
    let hoverItemIndex = fallback($$props['hoverItemIndex'], 0);
    let floatingConfig = fallback($$props['floatingConfig'], () => ({}), true);
    let containerClasses = fallback($$props['class'], '');
    let activeValue;
    let prev_value;
    let prev_filterText;
    function setValue() {
      if (typeof value === 'string') {
        let item = (items || []).find((item2) => item2[itemId] === value);
        value = item || { [itemId]: value, label: value };
      } else if (multiple && Array.isArray(value) && value.length > 0) {
        value = value.map((item) =>
          typeof item === 'string' ? { value: item, label: item } : item
        );
      }
    }
    let _inputAttributes;
    function assignInputAttributes() {
      _inputAttributes = Object.assign(
        {
          autocapitalize: 'none',
          autocomplete: 'off',
          autocorrect: 'off',
          spellcheck: false,
          tabindex: 0,
          type: 'text',
          'aria-autocomplete': 'list'
        },
        inputAttributes
      );
      if (id2) {
        _inputAttributes['id'] = id2;
      }
      if (!searchable) {
        _inputAttributes['readonly'] = true;
      }
    }
    function convertStringItemsToObjects(_items) {
      return _items.map((item, index) => {
        return { index, value: item, label: `${item}` };
      });
    }
    function filterGroupedItems(_items) {
      const groupValues = [];
      const groups = {};
      _items.forEach((item) => {
        const groupValue = groupBy2(item);
        if (!groupValues.includes(groupValue)) {
          groupValues.push(groupValue);
          groups[groupValue] = [];
          if (groupValue) {
            groups[groupValue].push(
              Object.assign(createGroupHeaderItem(groupValue, item), {
                id: groupValue,
                groupHeader: true,
                selectable: groupHeaderSelectable
              })
            );
          }
        }
        groups[groupValue].push(Object.assign({ groupItem: !!groupValue }, item));
      });
      const sortedGroupedItems = [];
      groupFilter(groupValues).forEach((groupValue) => {
        if (groups[groupValue]) sortedGroupedItems.push(...groups[groupValue]);
      });
      return sortedGroupedItems;
    }
    function dispatchSelectedItem() {
      if (multiple) {
        if (JSON.stringify(value) !== JSON.stringify(prev_value)) {
          if (checkValueForDuplicates());
        }
        return;
      }
    }
    function setupMulti() {
      if (value) {
        if (Array.isArray(value)) {
          value = [...value];
        } else {
          value = [value];
        }
      }
    }
    function setValueIndexAsHoverIndex() {
      const valueIndex = filteredItems.findIndex((i) => {
        return i[itemId] === value[itemId];
      });
      checkHoverSelectable(valueIndex, true);
    }
    function checkHoverSelectable(startingIndex = 0, ignoreGroup) {
      hoverItemIndex = startingIndex < 0 ? 0 : startingIndex;
      if (
        !ignoreGroup &&
        groupBy2 &&
        filteredItems[hoverItemIndex] &&
        !filteredItems[hoverItemIndex].selectable
      ) {
        setHoverIndex(1);
      }
    }
    function setupFilterText() {
      if (!loadOptions && filterText.length === 0) return;
      if (loadOptions) {
        debounce2(async function () {
          loading = true;
          let res = await getItems$1({
            dispatch,
            loadOptions,
            convertStringItemsToObjects,
            filterText
          });
          if (res) {
            loading = res.loading;
            listOpen = listOpen ? res.listOpen : filterText.length > 0 ? true : false;
            focused = listOpen && res.focused;
            items = groupBy2 ? filterGroupedItems(res.filteredItems) : res.filteredItems;
          } else {
            loading = false;
            focused = true;
            listOpen = true;
          }
        }, debounceWait);
      } else {
        listOpen = true;
        if (multiple) {
          activeValue = void 0;
        }
      }
    }
    function computeJustValue() {
      if (multiple) return value ? value.map((item) => item[itemId]) : null;
      return value ? value[itemId] : value;
    }
    function checkValueForDuplicates() {
      let noDuplicates = true;
      if (value) {
        const ids = [];
        const uniqueValues = [];
        value.forEach((val) => {
          if (!ids.includes(val[itemId])) {
            ids.push(val[itemId]);
            uniqueValues.push(val);
          } else {
            noDuplicates = false;
          }
        });
        if (!noDuplicates) value = uniqueValues;
      }
      return noDuplicates;
    }
    function findItem(selection) {
      let matchTo = selection ? selection[itemId] : value[itemId];
      return items.find((item) => item[itemId] === matchTo);
    }
    function updateValueDisplay(items2) {
      if (!items2 || items2.length === 0 || items2.some((item) => typeof item !== 'object')) return;
      if (
        !value ||
        (multiple ? value.some((selection) => !selection || !selection[itemId]) : !value[itemId])
      )
        return;
      if (Array.isArray(value)) {
        value = value.map((selection) => findItem(selection) || selection);
      } else {
        value = findItem() || value;
      }
    }
    function handleFocus(e) {
      if (focused && input === document?.activeElement) return;
      input?.focus();
      focused = true;
    }
    function handleClear() {
      value = void 0;
      closeList();
      handleFocus();
    }
    function closeList() {
      if (clearFilterTextOnBlur) {
        filterText = '';
      }
      listOpen = false;
    }
    let ariaValues = fallback($$props['ariaValues'], (values) => {
      return `Option ${values}, selected.`;
    });
    let ariaListOpen = fallback($$props['ariaListOpen'], (label3, count) => {
      return `You are currently focused on option ${label3}. There are ${count} results available.`;
    });
    let ariaFocused = fallback($$props['ariaFocused'], () => {
      return `Select is focused, type to refine list, press down to open the menu.`;
    });
    function handleAriaSelection(_multiple) {
      let selected = void 0;
      if (_multiple && value.length > 0) {
        selected = value.map((v) => v[label2]).join(', ');
      } else {
        selected = value[label2];
      }
      return ariaValues(selected);
    }
    function handleAriaContent() {
      if (!filteredItems || filteredItems.length === 0) return '';
      let _item = filteredItems[hoverItemIndex];
      if (listOpen && _item) {
        let count = filteredItems ? filteredItems.length : 0;
        return ariaListOpen(_item[label2], count);
      } else {
        return ariaFocused();
      }
    }
    onDestroy(() => {});
    function setHoverIndex(increment) {
      let selectableFilteredItems = filteredItems.filter(
        (item) => !Object.hasOwn(item, 'selectable') || item.selectable === true
      );
      if (selectableFilteredItems.length === 0) {
        return (hoverItemIndex = 0);
      }
      if (hoverItemIndex === filteredItems.length - 1) {
        hoverItemIndex = 0;
      } else {
        hoverItemIndex = hoverItemIndex + increment;
      }
      const hover = filteredItems[hoverItemIndex];
      if (hover && hover.selectable === false) {
        setHoverIndex(increment);
        return;
      }
    }
    function isItemActive(item, value2, itemId2) {
      if (multiple) return;
      return value2 && value2[itemId2] === item[itemId2];
    }
    function isItemFirst(itemIndex) {
      return itemIndex === 0;
    }
    let _floatingConfig = {
      strategy: 'absolute',
      placement: 'bottom-start',
      middleware: [offset(listOffset), flip(), shift()],
      autoUpdate: false
    };
    const [floatingRef, floatingContent, floatingUpdate] = createFloatingActions(_floatingConfig);
    let prefloat = true;
    function listMounted(list, listOpen2) {
      return (prefloat = true);
    }
    if (value) setValue();
    if (inputAttributes || !searchable) assignInputAttributes();
    if (multiple) setupMulti();
    if (multiple && value && value.length > 1) checkValueForDuplicates();
    if (value) dispatchSelectedItem();
    if (!focused && input) closeList();
    if (filterText !== prev_filterText) setupFilterText();
    filteredItems = filter$1({
      loadOptions,
      filterText,
      items,
      multiple,
      value,
      itemId,
      groupBy: groupBy2,
      label: label2,
      filterSelectedItems,
      itemFilter,
      convertStringItemsToObjects,
      filterGroupedItems
    });
    if (!multiple && listOpen && value && filteredItems) setValueIndexAsHoverIndex();
    if (listOpen && multiple) hoverItemIndex = 0;
    if (filterText) hoverItemIndex = 0;
    hasValue = multiple ? value && value.length > 0 : value;
    hideSelectedItem = hasValue && filterText.length > 0;
    showClear = hasValue && clearable && !disabled && !loading;
    placeholderText =
      placeholderAlwaysShow && multiple
        ? placeholder
        : multiple && value?.length === 0
          ? placeholder
          : value
            ? ''
            : placeholder;
    ariaSelection = value ? handleAriaSelection(multiple) : '';
    ariaContext = handleAriaContent();
    updateValueDisplay(items);
    justValue = computeJustValue();
    if (listOpen && filteredItems && !multiple && !value) checkHoverSelectable();
    if (container && floatingConfig) floatingUpdate(Object.assign(_floatingConfig, floatingConfig));
    listMounted();
    if (input && listOpen && !focused) handleFocus();
    if (container && floatingConfig?.autoUpdate === void 0) {
      _floatingConfig.autoUpdate = true;
    }
    $$renderer2.push(
      `<div${attr_class(`svelte-select ${stringify$1(containerClasses)}`, 'svelte-1ul7oo4', {
        multi: multiple,
        disabled: disabled,
        focused: focused,
        'list-open': listOpen,
        'show-chevron': showChevron,
        error: hasError
      })}${attr_style(containerStyles)} role="none">`
    );
    if (listOpen) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div${attr_class('svelte-select-list svelte-1ul7oo4', void 0, { prefloat: prefloat })} role="none">`
      );
      if ($$slots['list-prepend']) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, 'list-prepend', {}, null);
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--> `);
      if ($$slots.list) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, 'list', { filteredItems }, null);
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push('<!--[!-->');
        if (filteredItems.length > 0) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<!--[-->`);
          const each_array = ensure_array_like(filteredItems);
          for (let i = 0, $$length = each_array.length; i < $$length; i++) {
            let item = each_array[i];
            $$renderer2.push(
              `<div class="list-item svelte-1ul7oo4" tabindex="-1" role="none"><div${attr_class(
                'item svelte-1ul7oo4',
                void 0,
                {
                  'list-group-title': item.groupHeader,
                  active: isItemActive(item, value, itemId),
                  first: isItemFirst(i),
                  hover: hoverItemIndex === i,
                  'group-item': item.groupItem,
                  'not-selectable': item?.selectable === false
                }
              )}><!--[-->`
            );
            slot($$renderer2, $$props, 'item', { item, index: i }, () => {
              $$renderer2.push(`${escape_html(item?.[label2])}`);
            });
            $$renderer2.push(`<!--]--></div></div>`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push('<!--[!-->');
          if (!hideEmptyState) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(`<!--[-->`);
            slot($$renderer2, $$props, 'empty', {}, () => {
              $$renderer2.push(`<div class="empty svelte-1ul7oo4">No options</div>`);
            });
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push('<!--[!-->');
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--> `);
      if ($$slots['list-append']) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, 'list-append', {}, null);
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(
      `<!--]--> <span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="a11y-text svelte-1ul7oo4">`
    );
    if (focused) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<span id="aria-selection" class="svelte-1ul7oo4">${escape_html(ariaSelection)}</span> <span id="aria-context" class="svelte-1ul7oo4">${escape_html(ariaContext)}</span>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></span> <div class="prepend svelte-1ul7oo4"><!--[-->`);
    slot($$renderer2, $$props, 'prepend', {}, null);
    $$renderer2.push(`<!--]--></div> <div class="value-container svelte-1ul7oo4">`);
    if (hasValue) {
      $$renderer2.push('<!--[-->');
      if (multiple) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(value);
        for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
          let item = each_array_1[i];
          $$renderer2.push(
            `<div${attr_class('multi-item svelte-1ul7oo4', void 0, { active: activeValue === i, disabled: disabled })} role="none"><span class="multi-item-text svelte-1ul7oo4"><!--[-->`
          );
          slot($$renderer2, $$props, 'selection', { selection: item, index: i }, () => {
            $$renderer2.push(`${escape_html(item[label2])}`);
          });
          $$renderer2.push(`<!--]--></span> `);
          if (!disabled && !multiFullItemClearable && ClearIcon) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(`<div class="multi-item-clear svelte-1ul7oo4"><!--[-->`);
            slot($$renderer2, $$props, 'multi-clear-icon', {}, () => {
              ClearIcon($$renderer2);
            });
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push('<!--[!-->');
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `<div${attr_class('selected-item svelte-1ul7oo4', void 0, { 'hide-selected-item': hideSelectedItem })}><!--[-->`
        );
        slot($$renderer2, $$props, 'selection', { selection: value }, () => {
          $$renderer2.push(`${escape_html(value[label2])}`);
        });
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(
      `<!--]--> <input${attributes(
        {
          readonly: !searchable,
          ..._inputAttributes,
          value: filterText,
          placeholder: placeholderText,
          style: inputStyles,
          disabled
        },
        'svelte-1ul7oo4',
        void 0,
        void 0,
        4
      )}/></div> <div class="indicators svelte-1ul7oo4">`
    );
    if (loading) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<div class="icon loading svelte-1ul7oo4" aria-hidden="true"><!--[-->`);
      slot($$renderer2, $$props, 'loading-icon', {}, () => {
        LoadingIcon($$renderer2);
      });
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> `);
    if (showClear) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<button type="button" class="icon clear-select svelte-1ul7oo4"><!--[-->`);
      slot($$renderer2, $$props, 'clear-icon', {}, () => {
        ClearIcon($$renderer2);
      });
      $$renderer2.push(`<!--]--></button>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> `);
    if (showChevron) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<div class="icon chevron svelte-1ul7oo4" aria-hidden="true"><!--[-->`);
      slot($$renderer2, $$props, 'chevron-icon', { listOpen }, () => {
        ChevronIcon($$renderer2);
      });
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div> <!--[-->`);
    slot($$renderer2, $$props, 'input-hidden', { value }, () => {
      $$renderer2.push(
        `<input${attr('name', name)} type="hidden"${attr('value', value ? JSON.stringify(value) : null)} class="svelte-1ul7oo4"/>`
      );
    });
    $$renderer2.push(`<!--]--> `);
    if (required && (!value || value.length === 0)) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<!--[-->`);
      slot($$renderer2, $$props, 'required', { value }, () => {
        $$renderer2.push(
          `<select class="required svelte-1ul7oo4" required tabindex="-1" aria-hidden="true"></select>`
        );
      });
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, {
      justValue,
      filter: filter$1,
      getItems: getItems$1,
      id: id2,
      name,
      container,
      input,
      multiple,
      multiFullItemClearable,
      disabled,
      focused,
      value,
      filterText,
      placeholder,
      placeholderAlwaysShow,
      items,
      label: label2,
      itemFilter,
      groupBy: groupBy2,
      groupFilter,
      groupHeaderSelectable,
      itemId,
      loadOptions,
      containerStyles,
      hasError,
      filterSelectedItems,
      required,
      closeListOnChange,
      clearFilterTextOnBlur,
      createGroupHeaderItem,
      searchable,
      inputStyles,
      clearable,
      loading,
      listOpen,
      debounce: debounce2,
      debounceWait,
      hideEmptyState,
      inputAttributes,
      listAutoWidth,
      showChevron,
      listOffset,
      hoverItemIndex,
      floatingConfig,
      class: containerClasses,
      ariaValues,
      ariaListOpen,
      ariaFocused,
      getFilteredItems,
      handleClear
    });
  });
}
function TransformWizard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let jsonIsArray, paths, pathsIncludingObjects, fieldOptions, projectionOptions, projectionPaths;
    const debug2 = createDebug('jsoneditor:TransformWizard');
    let json = $$props['json'];
    let queryOptions = fallback($$props['queryOptions'], () => ({}), true);
    let onChange = $$props['onChange'];
    const filterRelationOptions = ['==', '!=', '<', '<=', '>', '>='].map((relation) => ({
      value: relation,
      label: relation
    }));
    const sortDirectionOptions = [
      { value: 'asc', label: 'ascending' },
      { value: 'desc', label: 'descending' }
    ];
    let filterPath = queryOptions?.filter?.path ? pathToOption(queryOptions.filter.path) : void 0;
    let filterRelation =
      filterRelationOptions.find((option) => option.value === queryOptions.filter?.relation) ??
      filterRelationOptions[0];
    let filterValue = queryOptions?.filter?.value || '';
    let sortPath = queryOptions?.sort?.path ? pathToOption(queryOptions.sort.path) : void 0;
    let sortDirection =
      sortDirectionOptions.find((option) => option.value === queryOptions.sort?.direction) ??
      sortDirectionOptions[0];
    function changeFilterPath(path) {
      if (!isEqual(queryOptions?.filter?.path, path)) {
        debug2('changeFilterPath', path);
        queryOptions = setIn(queryOptions, ['filter', 'path'], path, true);
        onChange(queryOptions);
      }
    }
    function changeFilterRelation(relation) {
      if (!isEqual(queryOptions?.filter?.relation, relation)) {
        debug2('changeFilterRelation', relation);
        queryOptions = setIn(queryOptions, ['filter', 'relation'], relation, true);
        onChange(queryOptions);
      }
    }
    function changeFilterValue(value) {
      if (!isEqual(queryOptions?.filter?.value, value)) {
        debug2('changeFilterValue', value);
        queryOptions = setIn(queryOptions, ['filter', 'value'], value, true);
        onChange(queryOptions);
      }
    }
    function changeSortPath(path) {
      if (!isEqual(queryOptions?.sort?.path, path)) {
        debug2('changeSortPath', path);
        queryOptions = setIn(queryOptions, ['sort', 'path'], path, true);
        onChange(queryOptions);
      }
    }
    function changeSortDirection(direction) {
      if (!isEqual(queryOptions?.sort?.direction, direction)) {
        debug2('changeSortDirection', direction);
        queryOptions = setIn(queryOptions, ['sort', 'direction'], direction, true);
        onChange(queryOptions);
      }
    }
    function changeProjectionPaths(paths2) {
      if (!isEqual(queryOptions?.projection?.paths, paths2)) {
        debug2('changeProjectionPaths', paths2);
        queryOptions = setIn(queryOptions, ['projection', 'paths'], paths2, true);
        onChange(queryOptions);
      }
    }
    jsonIsArray = Array.isArray(json);
    paths = jsonIsArray ? getNestedPaths(json) : [];
    pathsIncludingObjects = jsonIsArray ? getNestedPaths(json, true) : [];
    fieldOptions = paths.map(pathToOption);
    projectionOptions = pathsIncludingObjects ? pathsIncludingObjects.map(pathToOption) : [];
    projectionPaths =
      queryOptions?.projection?.paths && projectionOptions
        ? queryOptions.projection.paths
            .map((path) => projectionOptions.find((option) => isEqual(option.value, path)))
            .filter((option) => !!option)
        : void 0;
    changeFilterPath(filterPath?.value);
    changeFilterRelation(filterRelation?.value);
    changeFilterValue(filterValue);
    changeSortPath(sortPath?.value);
    changeSortDirection(sortDirection?.value);
    changeProjectionPaths(projectionPaths ? projectionPaths.map((item) => item.value) : void 0);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(
        `<table class="jse-transform-wizard svelte-1brpr3g"><tbody><tr class="svelte-1brpr3g"><th class="svelte-1brpr3g">Filter</th><td class="svelte-1brpr3g"><div class="jse-horizontal svelte-1brpr3g">`
      );
      Select($$renderer3, {
        class: 'jse-filter-path',
        showChevron: true,
        items: fieldOptions,
        get value() {
          return filterPath;
        },
        set value($$value) {
          filterPath = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      Select($$renderer3, {
        class: 'jse-filter-relation',
        showChevron: true,
        clearable: false,
        items: filterRelationOptions,
        get value() {
          return filterRelation;
        },
        set value($$value) {
          filterRelation = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(
        `<!----> <input class="jse-filter-value svelte-1brpr3g"${attr('value', filterValue)}/></div></td></tr><tr class="svelte-1brpr3g"><th class="svelte-1brpr3g">Sort</th><td class="svelte-1brpr3g"><div class="jse-horizontal svelte-1brpr3g">`
      );
      Select($$renderer3, {
        class: 'jse-sort-path',
        showChevron: true,
        items: fieldOptions,
        get value() {
          return sortPath;
        },
        set value($$value) {
          sortPath = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      Select($$renderer3, {
        class: 'jse-sort-direction',
        showChevron: true,
        clearable: false,
        items: sortDirectionOptions,
        get value() {
          return sortDirection;
        },
        set value($$value) {
          sortDirection = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(
        `<!----></div></td></tr><tr class="svelte-1brpr3g"><th class="svelte-1brpr3g">Pick</th><td class="svelte-1brpr3g"><div class="jse-horizontal svelte-1brpr3g">`
      );
      Select($$renderer3, {
        class: 'jse-projection-paths',
        multiple: true,
        showChevron: true,
        items: projectionOptions,
        get value() {
          return projectionPaths;
        },
        set value($$value) {
          projectionPaths = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div></td></tr></tbody></table>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { json, queryOptions, onChange });
  });
}
function Header($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let title = fallback($$props['title'], 'Modal');
    let fullScreenButton = fallback($$props['fullScreenButton'], false);
    let fullscreen = fallback($$props['fullscreen'], false);
    let onClose = fallback($$props['onClose'], void 0);
    $$renderer2.push(
      `<div class="jse-header svelte-y8gvfs"><div class="jse-title svelte-y8gvfs">${escape_html(title)}</div> <!--[-->`
    );
    slot($$renderer2, $$props, 'actions', {}, null);
    $$renderer2.push(`<!--]--> `);
    if (fullScreenButton) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<button type="button" class="jse-fullscreen svelte-y8gvfs" title="Toggle full screen">`
      );
      Icon($$renderer2, {
        data: fullscreen ? faDownLeftAndUpRightToCenter : faUpRightAndDownLeftFromCenter
      });
      $$renderer2.push(`<!----></button>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> <button type="button" class="jse-close svelte-y8gvfs">`);
    Icon($$renderer2, { data: faTimes });
    $$renderer2.push(`<!----></button></div>`);
    bind_props($$props, { title, fullScreenButton, fullscreen, onClose });
  });
}
function TransformModalHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let queryLanguages = $$props['queryLanguages'];
    let queryLanguageId = $$props['queryLanguageId'];
    let fullscreen = $$props['fullscreen'];
    let onChangeQueryLanguage = $$props['onChangeQueryLanguage'];
    let onClose = $$props['onClose'];
    const { openAbsolutePopup, closeAbsolutePopup } = getContext('absolute-popup');
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Header($$renderer3, {
        title: 'Transform',
        fullScreenButton: true,
        onClose,
        get fullscreen() {
          return fullscreen;
        },
        set fullscreen($$value) {
          fullscreen = $$value;
          $$settled = false;
        },
        $$slots: {
          actions: ($$renderer4) => {
            $$renderer4.push(
              `<button slot="actions" type="button"${attr_class('jse-config svelte-1r3wa3v', void 0, { hide: queryLanguages.length <= 1 })} title="Select a query language">`
            );
            Icon($$renderer4, { data: faCog });
            $$renderer4.push(`<!----></button>`);
          }
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      queryLanguages,
      queryLanguageId,
      fullscreen,
      onChangeQueryLanguage,
      onClose
    });
  });
}
function measure(callback, onDuration) {
  const start = Date.now();
  const result = callback();
  const end = Date.now();
  onDuration(end - start);
  return result;
}
const debug$3 = createDebug('validation');
const validationErrorsFactory = {
  createObjectDocumentState: () => ({ type: 'object', properties: {} }),
  createArrayDocumentState: () => ({ type: 'array', items: [] }),
  createValueDocumentState: () => ({ type: 'value' })
};
function updateInValidationErrors(json, errors, path, transform) {
  return updateInRecursiveState(json, errors, path, transform, validationErrorsFactory);
}
function toRecursiveValidationErrors(json, validationErrors) {
  let output;
  validationErrors.forEach((validationError) => {
    output = updateInValidationErrors(json, output, validationError.path, (_, state) => ({
      ...state,
      validationError
    }));
  });
  validationErrors.forEach((validationError) => {
    let parentPath = validationError.path;
    while (parentPath.length > 0) {
      parentPath = initial(parentPath);
      output = updateInValidationErrors(json, output, parentPath, (_, state) => {
        return state.validationError
          ? state
          : {
              ...state,
              validationError: {
                isChildError: true,
                path: parentPath,
                message: 'Contains invalid data',
                severity: ValidationSeverity.warning
              }
            };
      });
    }
  });
  return output;
}
function validateJSON(json, validator, parser, validationParser) {
  debug$3('validateJSON');
  if (!validator) {
    return [];
  }
  if (parser !== validationParser) {
    const text = parser.stringify(json);
    const convertedJSON = text !== void 0 ? validationParser.parse(text) : void 0;
    return validator(convertedJSON);
  } else {
    return validator(json);
  }
}
function validateText(text, validator, parser, validationParser) {
  debug$3('validateText');
  if (text.length > MAX_VALIDATABLE_SIZE) {
    const validationError = {
      path: [],
      message: 'Validation turned off: the document is too large',
      severity: ValidationSeverity.info
    };
    return {
      validationErrors: [validationError]
    };
  }
  if (text.length === 0) {
    return void 0;
  }
  try {
    const json = measure(
      () => parser.parse(text),
      (duration) => debug$3(`validate: parsed json in ${duration} ms`)
    );
    if (!validator) {
      return void 0;
    }
    const convertedJSON =
      parser === validationParser
        ? json
        : measure(
            () => validationParser.parse(text),
            (duration) =>
              debug$3(`validate: parsed json with the validationParser in ${duration} ms`)
          );
    const validationErrors = measure(
      () => validator(convertedJSON),
      (duration) => debug$3(`validate: validated json in ${duration} ms`)
    );
    return !isEmpty(validationErrors) ? { validationErrors } : void 0;
  } catch (err) {
    const isRepairable = measure(
      () => canAutoRepair(text, parser),
      (duration) => debug$3(`validate: checked whether repairable in ${duration} ms`)
    );
    const parseError = normalizeJsonParseError(text, err.message || err.toString());
    return {
      parseError,
      isRepairable
    };
  }
}
function canAutoRepair(text, parser) {
  if (text.length > MAX_AUTO_REPAIRABLE_SIZE) {
    return false;
  }
  try {
    parser.parse(jsonrepair(text));
    return true;
  } catch {
    return false;
  }
}
const debug$2 = createDebug('jsoneditor:FocusTracker');
function createFocusTracker({
  onMount,
  onDestroy: onDestroy2,
  getWindow: getWindow2,
  hasFocus,
  onFocus,
  onBlur
}) {
  let blurTimeoutHandle;
  let focus = false;
  function handleFocusIn() {
    const newFocus = hasFocus();
    if (newFocus) {
      clearTimeout(blurTimeoutHandle);
      if (!focus) {
        debug$2('focus');
        onFocus();
        focus = newFocus;
      }
    }
  }
  function handleFocusOut() {
    if (focus) {
      clearTimeout(blurTimeoutHandle);
      blurTimeoutHandle = setTimeout(() => {
        if (!hasFocus()) {
          debug$2('blur');
          focus = false;
          onBlur();
        }
      });
    }
  }
  onMount(() => {
    debug$2('mount FocusTracker');
    const window2 = getWindow2();
    if (window2) {
      window2.addEventListener('focusin', handleFocusIn, true);
      window2.addEventListener('focusout', handleFocusOut, true);
    }
  });
  onDestroy2(() => {
    debug$2('destroy FocusTracker');
    const window2 = getWindow2();
    if (window2) {
      window2.removeEventListener('focusin', handleFocusIn, true);
      window2.removeEventListener('focusout', handleFocusOut, true);
    }
  });
}
function Message($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let type = fallback($$props['type'], 'success');
    let icon = fallback($$props['icon'], void 0);
    let message = fallback($$props['message'], void 0);
    let actions = fallback($$props['actions'], () => [], true);
    let onClick = fallback($$props['onClick'], void 0);
    let onClose = fallback($$props['onClose'], void 0);
    if (onClose) {
      onDestroy(onClose);
    }
    $$renderer2.push(
      `<div${attr_class(`jse-message jse-${stringify$1(type)}`, 'svelte-1pn5qw0')}><div role="button" tabindex="-1"${attr_class('jse-text svelte-1pn5qw0', void 0, { 'jse-clickable': !!onClick })}><div class="jse-text-centered">`
    );
    if (icon) {
      $$renderer2.push('<!--[-->');
      Icon($$renderer2, { data: icon });
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(
      `<!--]--> ${escape_html(message)}</div></div> <div class="jse-actions svelte-1pn5qw0"><!--[-->`
    );
    const each_array = ensure_array_like(actions);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let action = each_array[$$index];
      $$renderer2.push(
        `<button type="button" class="jse-button jse-action jse-primary svelte-1pn5qw0"${attr('title', action.title)}${attr('disabled', action.disabled, true)}>`
      );
      if (action.icon) {
        $$renderer2.push('<!--[-->');
        Icon($$renderer2, { data: action.icon });
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--> ${escape_html(action.text)}</button>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { type, icon, message, actions, onClick, onClose });
  });
}
function ValidationErrorsOverview($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let count;
    let validationErrors = $$props['validationErrors'];
    let selectError = $$props['selectError'];
    count = validationErrors.length;
    if (!isEmpty(validationErrors)) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<div class="jse-validation-errors-overview svelte-1chroj6">`);
      {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<table class="jse-validation-errors-overview-expanded svelte-1chroj6"><tbody><!--[-->`
        );
        const each_array = ensure_array_like(limit(validationErrors, MAX_VALIDATION_ERRORS));
        for (let index = 0, $$length = each_array.length; index < $$length; index++) {
          let validationError = each_array[index];
          $$renderer2.push(
            `<tr${attr_class(`jse-validation-${stringify$1(validationError.severity)}`, 'svelte-1chroj6')} tabindex="0"><td class="jse-validation-error-icon svelte-1chroj6">`
          );
          Icon($$renderer2, { data: faExclamationTriangle });
          $$renderer2.push(
            `<!----></td><td class="jse-validation-error-path svelte-1chroj6">${escape_html(stringifyJSONPath(validationError.path))}</td><td class="jse-validation-error-message svelte-1chroj6">${escape_html(validationError.message)}</td><td class="jse-validation-error-action svelte-1chroj6">`
          );
          if (index === 0 && validationErrors.length > 1) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(
              `<button type="button" class="jse-validation-errors-collapse svelte-1chroj6" title="Collapse validation errors">`
            );
            Icon($$renderer2, { data: faAngleDown });
            $$renderer2.push(`<!----></button>`);
          } else {
            $$renderer2.push('<!--[!-->');
          }
          $$renderer2.push(`<!--]--></td></tr>`);
        }
        $$renderer2.push(`<!--]-->`);
        if (count > MAX_VALIDATION_ERRORS) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<tr class="jse-validation-error svelte-1chroj6"><td class="svelte-1chroj6"></td><td class="svelte-1chroj6"></td><td class="svelte-1chroj6">(and ${escape_html(count - MAX_VALIDATION_ERRORS)} more errors)</td><td class="svelte-1chroj6"></td></tr>`
          );
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--></tbody></table>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { validationErrors, selectError });
  });
}
function Modal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let className = fallback($$props['className'], void 0);
    let fullscreen = fallback($$props['fullscreen'], false);
    let onClose = $$props['onClose'];
    let dialog2;
    onDestroy(() => dialog2.close());
    $$renderer2.push(
      `<dialog${attr_class(clsx$1(classnames('jse-modal', className)), 'svelte-puv2fa', { 'jse-fullscreen': fullscreen })}><div class="jse-modal-inner svelte-puv2fa"><!--[-->`
    );
    slot($$renderer2, $$props, 'default', {}, null);
    $$renderer2.push(`<!--]--></div></dialog>`);
    bind_props($$props, { className, fullscreen, onClose });
  });
}
function CopyPasteModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let onClose = $$props['onClose'];
    const ctrl = isMacDevice() ? '⌘' : 'Ctrl';
    Modal($$renderer2, {
      onClose,
      className: 'jse-copy-paste',
      children: ($$renderer3) => {
        Header($$renderer3, { title: 'Copying and pasting', onClose });
        $$renderer3.push(
          `<!----> <div class="jse-modal-contents svelte-11kndi4"><div>Clipboard permission is disabled by your browser. You can use:</div> <div class="jse-shortcuts svelte-11kndi4"><div class="jse-shortcut svelte-11kndi4"><div class="jse-key svelte-11kndi4">${escape_html(ctrl)}+C</div> for copy</div> <div class="jse-shortcut svelte-11kndi4"><div class="jse-key svelte-11kndi4">${escape_html(ctrl)}+X</div> for cut</div> <div class="jse-shortcut svelte-11kndi4"><div class="jse-key svelte-11kndi4">${escape_html(ctrl)}+V</div> for paste</div></div> <div class="jse-actions svelte-11kndi4"><button type="button" class="jse-primary svelte-11kndi4">Close</button></div></div>`
        );
      },
      $$slots: { default: true }
    });
    bind_props($$props, { onClose });
  });
}
function Menu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let items = fallback($$props['items'], () => [], true);
    function unknownMenuItem(item) {
      console.error('Unknown type of menu item', item);
      return '???';
    }
    $$renderer2.push(`<div class="jse-menu svelte-196gvk2"><!--[-->`);
    slot($$renderer2, $$props, 'left', {}, null);
    $$renderer2.push(`<!--]--> <!--[-->`);
    const each_array = ensure_array_like(items);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      if (isMenuSeparator(item)) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<div class="jse-separator svelte-196gvk2"></div>`);
      } else {
        $$renderer2.push('<!--[!-->');
        if (isMenuSpace(item)) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<div class="jse-space svelte-196gvk2"></div>`);
        } else {
          $$renderer2.push('<!--[!-->');
          if (isMenuButton(item)) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(
              `<button type="button"${attr_class(`jse-button ${stringify$1(item.className)}`, 'svelte-196gvk2')}${attr('title', item.title)}${attr('disabled', item.disabled || false, true)}>`
            );
            if (item.icon) {
              $$renderer2.push('<!--[-->');
              Icon($$renderer2, { data: item.icon });
            } else {
              $$renderer2.push('<!--[!-->');
            }
            $$renderer2.push(`<!--]--> `);
            if (item.text) {
              $$renderer2.push('<!--[-->');
              $$renderer2.push(`${escape_html(item.text)}`);
            } else {
              $$renderer2.push('<!--[!-->');
            }
            $$renderer2.push(`<!--]--></button>`);
          } else {
            $$renderer2.push('<!--[!-->');
            $$renderer2.push(`${escape_html(unknownMenuItem(item))}`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    slot($$renderer2, $$props, 'right', {}, null);
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { items });
  });
}
function JSONRepairComponent($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let error, repairable, gotoAction, repairAction, errorActions, successActions;
    let text = fallback($$props['text'], '');
    let readOnly = fallback($$props['readOnly'], false);
    let onParse = $$props['onParse'];
    let onRepair = $$props['onRepair'];
    let onChange = fallback($$props['onChange'], void 0);
    let onApply = $$props['onApply'];
    let onCancel = $$props['onCancel'];
    const debug2 = createDebug('jsoneditor:JSONRepair');
    function getErrorMessage(jsonText) {
      try {
        onParse(jsonText);
        return void 0;
      } catch (err) {
        return normalizeJsonParseError(jsonText, err.message);
      }
    }
    function isRepairable(jsonText) {
      try {
        onRepair(jsonText);
        return true;
      } catch {
        return false;
      }
    }
    function goToError() {}
    function handleApply() {
      onApply(text);
    }
    function handleRepair() {
      try {
        text = onRepair(text);
        if (onChange) {
          onChange(text);
        }
      } catch {}
    }
    let items;
    error = getErrorMessage(text);
    repairable = isRepairable(text);
    debug2('error', error);
    items = [
      { type: 'space' },
      {
        type: 'button',
        icon: faTimes,
        title: 'Cancel repair',
        className: 'jse-cancel',
        onClick: onCancel
      }
    ];
    gotoAction = {
      icon: faArrowDown,
      text: 'Show me',
      title: 'Scroll to the error location',
      onClick: goToError
    };
    repairAction = {
      icon: faWrench,
      text: 'Auto repair',
      title: 'Automatically repair JSON',
      onClick: handleRepair
    };
    errorActions = repairable ? [gotoAction, repairAction] : [gotoAction];
    successActions = [
      {
        icon: faCheck,
        text: 'Apply',
        title: 'Apply fixed JSON',
        disabled: readOnly,
        onClick: handleApply
      }
    ];
    $$renderer2.push(`<div class="jse-json-repair-component svelte-77h21f">`);
    Menu($$renderer2, {
      items,
      $$slots: {
        left: ($$renderer3) => {
          $$renderer3.push(
            `<div slot="left" class="jse-info svelte-77h21f">Repair invalid JSON, then click apply</div>`
          );
        }
      }
    });
    $$renderer2.push(`<!----> `);
    if (error) {
      $$renderer2.push('<!--[-->');
      Message($$renderer2, {
        type: 'error',
        icon: faExclamationTriangle,
        message: `Cannot parse JSON: ${error.message}`,
        actions: errorActions
      });
    } else {
      $$renderer2.push('<!--[!-->');
      Message($$renderer2, {
        type: 'success',
        message: 'JSON is valid now and can be parsed.',
        actions: successActions
      });
    }
    $$renderer2.push(
      `<!--]--> <textarea${attr('readonly', readOnly, true)} class="jse-json-text svelte-77h21f" autocomplete="off" autocapitalize="off" spellcheck="false">`
    );
    const $$body = escape_html(text);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea></div>`);
    bind_props($$props, {
      text,
      readOnly,
      onParse,
      onRepair,
      onChange,
      onApply,
      onCancel
    });
  });
}
function JSONRepairModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let text = $$props['text'];
    let onParse = $$props['onParse'];
    let onRepair = $$props['onRepair'];
    let onApply = $$props['onApply'];
    let onClose = $$props['onClose'];
    function handleApply(repairedText) {
      onApply(repairedText);
      onClose();
    }
    function handleCancel() {
      onClose();
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Modal($$renderer3, {
        onClose,
        className: 'jse-repair-modal',
        children: ($$renderer4) => {
          JSONRepairComponent($$renderer4, {
            onParse,
            onRepair,
            onApply: handleApply,
            onCancel: handleCancel,
            get text() {
              return text;
            },
            set text($$value) {
              text = $$value;
              $$settled = false;
            }
          });
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { text, onParse, onRepair, onApply, onClose });
  });
}
function CollapsedItems($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let visibleSection, startIndex, endIndex, selected, expandItemsSections;
    let visibleSections = $$props['visibleSections'];
    let sectionIndex = $$props['sectionIndex'];
    let total = $$props['total'];
    let path = $$props['path'];
    let selection = $$props['selection'];
    let onExpandSection = $$props['onExpandSection'];
    let context = $$props['context'];
    visibleSection = visibleSections[sectionIndex];
    startIndex = visibleSection.end;
    endIndex = visibleSections[sectionIndex + 1] ? visibleSections[sectionIndex + 1].start : total;
    selected = pathInSelection(context.getJson(), selection, path.concat(String(startIndex)));
    expandItemsSections = getExpandItemsSections(startIndex, endIndex);
    $$renderer2.push(
      `<div role="none"${attr_class('jse-collapsed-items svelte-1z9v8u', void 0, { 'jse-selected': selected })}${attr_style('', { '--level': path.length + 2 })}><div><div class="jse-text svelte-1z9v8u">Items ${escape_html(startIndex)}-${escape_html(endIndex)}</div> <!--[-->`
    );
    const each_array = ensure_array_like(expandItemsSections);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let expandItemsSection = each_array[$$index];
      $$renderer2.push(
        `<button type="button" class="jse-expand-items svelte-1z9v8u">show ${escape_html(expandItemsSection.start)}-${escape_html(expandItemsSection.end)}</button>`
      );
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, {
      visibleSections,
      sectionIndex,
      total,
      path,
      selection,
      onExpandSection,
      context
    });
  });
}
function ContextMenuPointer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let root = fallback($$props['root'], false);
    let insert2 = fallback($$props['insert'], false);
    let selected = $$props['selected'];
    let onContextMenu = $$props['onContextMenu'];
    $$renderer2.push(
      `<button type="button"${attr_class('jse-context-menu-pointer svelte-1talivj', void 0, {
        'jse-root': root,
        'jse-insert': insert2,
        'jse-selected': selected
      })}${attr('title', CONTEXT_MENU_EXPLANATION)}>`
    );
    Icon($$renderer2, { data: faCaretDown });
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { root, insert: insert2, selected, onContextMenu });
  });
}
function JSONKey($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isKeySelected, isEditingKey;
    let pointer = $$props['pointer'];
    let key = $$props['key'];
    let selection = $$props['selection'];
    let searchResultItems = $$props['searchResultItems'];
    let onUpdateKey = $$props['onUpdateKey'];
    let context = $$props['context'];
    let path;
    function handleChangeValue(newKey, updateSelection) {
      const updatedKey = onUpdateKey(key, context.normalization.unescapeValue(newKey));
      const updatedPath = initial(path).concat(updatedKey);
      context.onSelect(
        updateSelection === UpdateSelectionAfterChange.nextInside
          ? createValueSelection(updatedPath)
          : createKeySelection(updatedPath)
      );
      if (updateSelection !== UpdateSelectionAfterChange.self) {
        context.focus();
      }
    }
    function handleCancelChange() {
      context.onSelect(createKeySelection(path));
      context.focus();
    }
    path = parseJSONPointer(pointer);
    isKeySelected = isKeySelection(selection) && isEqual(selection.path, path);
    isEditingKey = isKeySelected && isEditingSelection(selection);
    if (!context.readOnly && isEditingKey) {
      $$renderer2.push('<!--[-->');
      EditableDiv($$renderer2, {
        value: context.normalization.escapeValue(key),
        initialValue: isEditingSelection(selection) ? selection.initialValue : void 0,
        label: 'Edit key',
        shortText: true,
        onChange: handleChangeValue,
        onCancel: handleCancelChange,
        onFind: context.onFind
      });
    } else {
      $$renderer2.push('<!--[!-->');
      $$renderer2.push(
        `<div role="none" data-type="selectable-key"${attr_class('jse-key svelte-6o1g0a', void 0, { 'jse-empty': key === '' })}>`
      );
      if (searchResultItems) {
        $$renderer2.push('<!--[-->');
        SearchResultHighlighter($$renderer2, {
          text: context.normalization.escapeValue(key),
          searchResultItems
        });
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `${escape_html(addNewLineSuffix(context.normalization.escapeValue(key)))}`
        );
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (!context.readOnly && isKeySelected && !isEditingKey) {
      $$renderer2.push('<!--[-->');
      ContextMenuPointer($$renderer2, { selected: true, onContextMenu: context.onContextMenu });
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      pointer,
      key,
      selection,
      searchResultItems,
      onUpdateKey,
      context
    });
  });
}
function JSONValue($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const { path, value, context, enforceString, selection, searchResultItems } = $$props;
    const isEditing = isValueSelection(selection) && isEditingSelection(selection);
    const renderers = context.onRenderValue({
      path,
      value,
      mode: context.mode,
      truncateTextSize: context.truncateTextSize,
      readOnly: context.readOnly,
      enforceString,
      isEditing,
      parser: context.parser,
      normalization: context.normalization,
      selection,
      searchResultItems,
      onPatch: context.onPatch,
      onPasteJson: context.onPasteJson,
      onSelect: context.onSelect,
      onFind: context.onFind,
      findNextInside: context.findNextInside,
      focus: context.focus
    });
    $$renderer2.push(`<!--[-->`);
    const each_array = ensure_array_like(renderers);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let renderer = each_array[$$index];
      if (isSvelteActionRenderer(renderer)) {
        $$renderer2.push('<!--[-->');
        renderer.action;
        $$renderer2.push(
          `<div role="button" tabindex="-1" class="jse-value" data-type="selectable-value"></div>`
        );
      } else {
        $$renderer2.push('<!--[!-->');
        const Component = renderer.component;
        $$renderer2.push(`<!---->`);
        Component($$renderer2, spread_props([renderer.props]));
        $$renderer2.push(`<!---->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function onMoveSelection({ json, selection, deltaY, items }) {
  if (!selection) {
    return {
      operations: void 0,
      updatedSelection: void 0,
      offset: 0
    };
  }
  const dragInsideAction =
    deltaY < 0
      ? findSwapPathUp({ json, selection, deltaY, items })
      : findSwapPathDown({ json, selection, deltaY, items });
  if (!dragInsideAction || dragInsideAction.offset === 0) {
    return {
      operations: void 0,
      updatedSelection: void 0,
      offset: 0
    };
  }
  const operations = moveInsideParent(json, selection, dragInsideAction);
  const path = initial(getStartPath(json, selection));
  const value = getIn(json, path);
  if (Array.isArray(value)) {
    const updatedSelection = createUpdatedArraySelection({
      items,
      json,
      selection,
      offset: dragInsideAction.offset
    });
    return {
      operations,
      updatedSelection,
      offset: dragInsideAction.offset
    };
  } else {
    return {
      operations,
      updatedSelection: void 0,
      offset: dragInsideAction.offset
    };
  }
}
function findSwapPathUp({ json, items, selection, deltaY }) {
  const initialPath = getStartPath(json, selection);
  const initialIndex = items.findIndex((item) => isEqual(item.path, initialPath));
  const prevHeight = () => items[index - 1]?.height;
  let index = initialIndex;
  let cumulativeHeight = 0;
  while (prevHeight() !== void 0 && Math.abs(deltaY) > cumulativeHeight + prevHeight() / 2) {
    cumulativeHeight += prevHeight();
    index -= 1;
  }
  const beforePath = items[index].path;
  const offset2 = index - initialIndex;
  return index !== initialIndex && items[index] !== void 0
    ? { beforePath, offset: offset2 }
    : void 0;
}
function findSwapPathDown({ json, items, selection, deltaY }) {
  const initialPath = getEndPath(json, selection);
  const initialIndex = items.findIndex((item) => isEqual(item.path, initialPath));
  let cumulativeHeight = 0;
  let index = initialIndex;
  const nextHeight = () => items[index + 1]?.height;
  while (nextHeight() !== void 0 && Math.abs(deltaY) > cumulativeHeight + nextHeight() / 2) {
    cumulativeHeight += nextHeight();
    index += 1;
  }
  const parentPath = initial(initialPath);
  const parent = getIn(json, parentPath);
  const isArray = Array.isArray(parent);
  const beforeIndex = isArray ? index : index + 1;
  const beforePath = items[beforeIndex]?.path;
  const offset2 = index - initialIndex;
  return beforePath ? { beforePath, offset: offset2 } : { append: true, offset: offset2 };
}
function createUpdatedArraySelection({ items, json, selection, offset: offset2 }) {
  const startPath = getStartPath(json, selection);
  const endPath = getEndPath(json, selection);
  const startIndex = items.findIndex((item) => isEqual(item.path, startPath));
  const endIndex = items.findIndex((item) => isEqual(item.path, endPath));
  const anchorPath = items[startIndex + offset2]?.path;
  const focusPath = items[endIndex + offset2]?.path;
  return createMultiSelection(anchorPath, focusPath);
}
function ValidationErrorIcon($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    getContext('absolute-popup');
    let validationError = $$props['validationError'];
    let onExpand = $$props['onExpand'];
    isNestedValidationError(validationError) && validationError.isChildError
      ? 'Contains invalid data'
      : validationError.message;
    $$renderer2.push(
      `<button type="button"${attr_class(`jse-validation-${stringify$1(validationError.severity)}`, 'svelte-1gvcg6h')}>`
    );
    Icon($$renderer2, { data: faExclamationTriangle });
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { validationError, onExpand });
  });
}
function JSONNode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let dataPath, root;
    let pointer = $$props['pointer'];
    let value = $$props['value'];
    let state = $$props['state'];
    let validationErrors = $$props['validationErrors'];
    let searchResults = $$props['searchResults'];
    let selection = $$props['selection'];
    let context = $$props['context'];
    let onDragSelectionStart = $$props['onDragSelectionStart'];
    const debug2 = createDebug('jsoneditor:JSONNode');
    let hover = void 0;
    let dragging = void 0;
    let path;
    let expanded;
    let enforceString;
    let visibleSections;
    let validationError;
    let isNodeSelected;
    function getKeys(object, dragging2) {
      const keys = Object.keys(object);
      if (dragging2 && dragging2.offset !== 0) {
        return moveItems(
          keys,
          dragging2.selectionStartIndex,
          dragging2.selectionItemsCount,
          dragging2.offset
        );
      }
      return keys;
    }
    function getItems2(array, visibleSection, dragging2) {
      const start = visibleSection.start;
      const end = Math.min(visibleSection.end, array.length);
      const indices = range(start, end);
      if (dragging2 && dragging2.offset !== 0) {
        return moveItems(
          indices,
          dragging2.selectionStartIndex,
          dragging2.selectionItemsCount,
          dragging2.offset
        ).map((index, gutterIndex) => ({ index, gutterIndex }));
      }
      return indices.map((index) => ({ index, gutterIndex: index }));
    }
    function handleExpand() {
      context.onExpand(path, true);
    }
    function handleUpdateKey(oldKey, newKey) {
      const operations = rename(path, Object.keys(value), oldKey, newKey);
      context.onPatch(operations);
      return last(parseJSONPointer(operations[0].path));
    }
    function findContentTop() {
      return context.findElement([])?.getBoundingClientRect()?.top || 0;
    }
    function calculateDeltaY(dragging2, event) {
      const contentTop = findContentTop();
      const contentOffset = contentTop - dragging2.initialContentTop;
      const clientOffset = event.clientY - dragging2.initialClientY;
      return clientOffset - contentOffset;
    }
    function handleDragSelectionStart(event) {
      if (context.readOnly || !selection) {
        return;
      }
      const selectionParentPath = initial(getFocusPath(selection));
      if (!isEqual(path, selectionParentPath)) {
        onDragSelectionStart(event);
        return;
      }
      const items = getVisibleItemsWithHeights(
        selection,
        visibleSections || DEFAULT_VISIBLE_SECTIONS
      );
      debug2('dragSelectionStart', { selection, items });
      if (!items) {
        debug2('Cannot drag the current selection (probably spread over multiple sections)');
        return;
      }
      const json = context.getJson();
      if (json === void 0) {
        return;
      }
      const initialPath = getStartPath(json, selection);
      const selectionStartIndex = items.findIndex((item) => isEqual(item.path, initialPath));
      const { offset: offset2 } = onMoveSelection({
        json,
        selection: context.getSelection(),
        deltaY: 0,
        items
      });
      dragging = {
        initialTarget: event.target,
        initialClientY: event.clientY,
        initialContentTop: findContentTop(),
        selectionStartIndex,
        selectionItemsCount: getSelectionPaths(json, selection).length,
        items,
        offset: offset2,
        didMoveItems: false
        // whether items have been moved during dragging or not
      };
      document.addEventListener('mousemove', handleDragSelection, true);
      document.addEventListener('mouseup', handleDragSelectionEnd);
    }
    function handleDragSelection(event) {
      if (dragging) {
        const json = context.getJson();
        if (json === void 0) {
          return;
        }
        const deltaY = calculateDeltaY(dragging, event);
        const { offset: offset2 } = onMoveSelection({
          json,
          selection: context.getSelection(),
          deltaY,
          items: dragging.items
        });
        if (offset2 !== dragging.offset) {
          debug2('drag selection', offset2, deltaY);
          dragging = { ...dragging, offset: offset2, didMoveItems: true };
        }
      }
    }
    function handleDragSelectionEnd(event) {
      if (dragging) {
        const json = context.getJson();
        if (json === void 0) {
          return;
        }
        const deltaY = calculateDeltaY(dragging, event);
        const { operations, updatedSelection } = onMoveSelection({
          json,
          selection: context.getSelection(),
          deltaY,
          items: dragging.items
        });
        if (operations) {
          context.onPatch(operations, (_, patchedState) => ({
            state: patchedState,
            selection: updatedSelection ?? selection
          }));
        } else {
          if (event.target === dragging.initialTarget && !dragging.didMoveItems) {
            const selectionType = getSelectionTypeFromTarget(event.target);
            const path2 = getDataPathFromTarget(event.target);
            if (path2) {
              context.onSelect(fromSelectionType(selectionType, path2));
            }
          }
        }
        dragging = void 0;
        document.removeEventListener('mousemove', handleDragSelection, true);
        document.removeEventListener('mouseup', handleDragSelectionEnd);
      }
    }
    function getVisibleItemsWithHeights(selection2, visibleSections2) {
      const items = [];
      function addHeight(prop) {
        const itemPath = path.concat(prop);
        const element2 = context.findElement(itemPath);
        if (element2 !== void 0) {
          items.push({ path: itemPath, height: element2.clientHeight });
        }
      }
      if (Array.isArray(value)) {
        const json = context.getJson();
        if (json === void 0) {
          return void 0;
        }
        const startPath = getStartPath(json, selection2);
        const endPath = getEndPath(json, selection2);
        const startIndex = parseInt(last(startPath), 10);
        const endIndex = parseInt(last(endPath), 10);
        const currentSection = visibleSections2.find((visibleSection) => {
          return startIndex >= visibleSection.start && endIndex <= visibleSection.end;
        });
        if (!currentSection) {
          return void 0;
        }
        const { start, end } = currentSection;
        forEachIndex(start, Math.min(value.length, end), (index) => addHeight(String(index)));
      } else {
        Object.keys(value).forEach(addHeight);
      }
      return items;
    }
    function handleInsertInsideOpenContextMenu(contextMenuProps) {
      context.onSelect(createInsideSelection(path));
      context.onContextMenu(contextMenuProps);
    }
    function handleInsertAfterOpenContextMenu(contextMenuProps) {
      context.onSelect(createAfterSelection(path));
      context.onContextMenu(contextMenuProps);
    }
    path = parseJSONPointer(pointer);
    dataPath = encodeURIComponent(pointer);
    expanded = isExpandableState(state) ? state.expanded : false;
    enforceString = getEnforceString(value, state, []);
    visibleSections = isArrayRecursiveState(state) ? state.visibleSections : void 0;
    validationError = validationErrors?.validationError;
    isNodeSelected = pathInSelection(context.getJson(), selection, path);
    root = path.length === 0;
    $$renderer2.push(
      `<div role="treeitem" tabindex="-1"${attr_class(
        clsx$1(
          classnames(
            'jse-json-node',
            { 'jse-expanded': expanded },
            context.onClassName(path, value)
          )
        ),
        'svelte-ik1vm9',
        {
          'jse-root': root,
          'jse-selected': isNodeSelected && isMultiSelection(selection),
          'jse-selected-value': isNodeSelected && isValueSelection(selection),
          'jse-readonly': context.readOnly,
          'jse-hovered': hover === HOVER_COLLECTION
        }
      )}${attr('data-path', dataPath)}${attr('aria-selected', isNodeSelected)}${attr_style('', { '--level': path.length })}>`
    );
    if (Array.isArray(value)) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div class="jse-header-outer svelte-ik1vm9"><div class="jse-header svelte-ik1vm9"><button type="button" class="jse-expand svelte-ik1vm9" title="Expand or collapse this array (Ctrl+Click to expand/collapse recursively)">`
      );
      if (expanded) {
        $$renderer2.push('<!--[-->');
        Icon($$renderer2, { data: faCaretDown });
      } else {
        $$renderer2.push('<!--[!-->');
        Icon($$renderer2, { data: faCaretRight });
      }
      $$renderer2.push(`<!--]--></button> <!--[-->`);
      slot($$renderer2, $$props, 'identifier', {}, null);
      $$renderer2.push(`<!--]--> `);
      if (!root) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<div class="jse-separator svelte-ik1vm9">:</div>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(
        `<!--]--> <div class="jse-meta svelte-ik1vm9"><div class="jse-meta-inner svelte-ik1vm9" data-type="selectable-value">`
      );
      if (expanded) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<div class="jse-bracket svelte-ik1vm9">[</div> `);
        Tag($$renderer2, {
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(value.length)}
                ${escape_html(value.length === 1 ? 'item' : 'items')}`);
          }
        });
        $$renderer2.push(`<!---->  `);
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(`<div class="jse-bracket svelte-ik1vm9">[</div> `);
        Tag($$renderer2, {
          onclick: handleExpand,
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(value.length)}
                ${escape_html(value.length === 1 ? 'item' : 'items')}`);
          }
        });
        $$renderer2.push(`<!----> <div class="jse-bracket svelte-ik1vm9">]</div>`);
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (
        !context.readOnly &&
        isNodeSelected &&
        selection &&
        (isValueSelection(selection) || isMultiSelection(selection)) &&
        !isEditingSelection(selection) &&
        isEqual(getFocusPath(selection), path)
      ) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<div class="jse-context-menu-pointer-anchor svelte-ik1vm9">`);
        ContextMenuPointer($$renderer2, {
          root,
          selected: true,
          onContextMenu: context.onContextMenu
        });
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--></div> `);
      if (validationError && (!expanded || !validationError.isChildError)) {
        $$renderer2.push('<!--[-->');
        ValidationErrorIcon($$renderer2, { validationError, onExpand: handleExpand });
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--> `);
      if (expanded) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<div role="none" class="jse-insert-selection-area jse-inside svelte-ik1vm9" data-type="insert-selection-area-inside"></div>`
        );
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `<div role="none" class="jse-insert-selection-area jse-after svelte-ik1vm9" data-type="insert-selection-area-after"></div>`
        );
      }
      $$renderer2.push(`<!--]--></div> `);
      if (expanded) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`<div class="jse-items svelte-ik1vm9">`);
        if (!context.readOnly && isNodeSelected && isInsideSelection(selection)) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<div${attr_class('jse-insert-area jse-inside svelte-ik1vm9', void 0, {
              'jse-hovered': hover === HOVER_INSERT_INSIDE,
              'jse-selected': isNodeSelected && isInsideSelection(selection)
            })} data-type="insert-selection-area-inside"${attr('title', INSERT_EXPLANATION)}${attr_style('', { '--level': path.length + 1 })}>`
          );
          ContextMenuPointer($$renderer2, {
            insert: true,
            selected: isNodeSelected && isInsideSelection(selection),
            onContextMenu: handleInsertInsideOpenContextMenu
          });
          $$renderer2.push(`<!----></div>`);
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--> <!--[-->`);
        const each_array = ensure_array_like(visibleSections || DEFAULT_VISIBLE_SECTIONS);
        for (
          let sectionIndex = 0, $$length = each_array.length;
          sectionIndex < $$length;
          sectionIndex++
        ) {
          let visibleSection = each_array[sectionIndex];
          $$renderer2.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(getItems2(value, visibleSection, dragging));
          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
            let item = each_array_1[$$index];
            const nestedValidationErrors = isArrayRecursiveState(validationErrors)
              ? validationErrors.items[item.index]
              : void 0;
            const nestedSelection = selectionIfOverlapping(
              context.getJson(),
              selection,
              path.concat(String(item.index))
            );
            JSONNode($$renderer2, {
              value: value[item.index],
              pointer: appendToJSONPointer(pointer, item.index),
              state: isArrayRecursiveState(state) ? state.items[item.index] : void 0,
              validationErrors: nestedValidationErrors,
              searchResults: isArrayRecursiveState(searchResults)
                ? searchResults.items[item.index]
                : void 0,
              selection: nestedSelection,
              context,
              onDragSelectionStart: handleDragSelectionStart,
              $$slots: {
                identifier: ($$renderer3) => {
                  $$renderer3.push(
                    `<div slot="identifier" class="jse-identifier svelte-ik1vm9"><div class="jse-index svelte-ik1vm9">${escape_html(item.gutterIndex)}</div></div>`
                  );
                }
              }
            });
            $$renderer2.push(`<!---->`);
          }
          $$renderer2.push(`<!--]--> `);
          if (visibleSection.end < value.length) {
            $$renderer2.push('<!--[-->');
            CollapsedItems($$renderer2, {
              visibleSections: visibleSections || DEFAULT_VISIBLE_SECTIONS,
              sectionIndex,
              total: value.length,
              path,
              onExpandSection: context.onExpandSection,
              selection,
              context
            });
          } else {
            $$renderer2.push('<!--[!-->');
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(
          `<!--]--></div> <div class="jse-footer-outer svelte-ik1vm9"><div data-type="selectable-value" class="jse-footer svelte-ik1vm9"><span class="jse-bracket svelte-ik1vm9">]</span></div> `
        );
        if (!root) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<div role="none" class="jse-insert-selection-area jse-after svelte-ik1vm9" data-type="insert-selection-area-after"></div>`
          );
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push('<!--[!-->');
      if (isObject$1(value)) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<div class="jse-header-outer svelte-ik1vm9"><div class="jse-header svelte-ik1vm9"><button type="button" class="jse-expand svelte-ik1vm9" title="Expand or collapse this object (Ctrl+Click to expand/collapse recursively)">`
        );
        if (expanded) {
          $$renderer2.push('<!--[-->');
          Icon($$renderer2, { data: faCaretDown });
        } else {
          $$renderer2.push('<!--[!-->');
          Icon($$renderer2, { data: faCaretRight });
        }
        $$renderer2.push(`<!--]--></button> <!--[-->`);
        slot($$renderer2, $$props, 'identifier', {}, null);
        $$renderer2.push(`<!--]--> `);
        if (!root) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<div class="jse-separator svelte-ik1vm9">:</div>`);
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(
          `<!--]--> <div class="jse-meta svelte-ik1vm9" data-type="selectable-value"><div class="jse-meta-inner svelte-ik1vm9">`
        );
        if (expanded) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<div class="jse-bracket jse-expanded svelte-ik1vm9">{</div>`);
        } else {
          $$renderer2.push('<!--[!-->');
          $$renderer2.push(`<div class="jse-bracket svelte-ik1vm9">{</div> `);
          Tag($$renderer2, {
            onclick: handleExpand,
            children: ($$renderer3) => {
              $$renderer3.push(`<!---->${escape_html(Object.keys(value).length)}
                ${escape_html(Object.keys(value).length === 1 ? 'prop' : 'props')}`);
            }
          });
          $$renderer2.push(`<!----> <div class="jse-bracket svelte-ik1vm9">}</div>`);
        }
        $$renderer2.push(`<!--]--></div></div> `);
        if (
          !context.readOnly &&
          isNodeSelected &&
          selection &&
          (isValueSelection(selection) || isMultiSelection(selection)) &&
          !isEditingSelection(selection) &&
          isEqual(getFocusPath(selection), path)
        ) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<div class="jse-context-menu-pointer-anchor svelte-ik1vm9">`);
          ContextMenuPointer($$renderer2, {
            root,
            selected: true,
            onContextMenu: context.onContextMenu
          });
          $$renderer2.push(`<!----></div>`);
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--></div> `);
        if (validationError && (!expanded || !validationError.isChildError)) {
          $$renderer2.push('<!--[-->');
          ValidationErrorIcon($$renderer2, { validationError, onExpand: handleExpand });
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--> `);
        if (expanded) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<div role="none" class="jse-insert-selection-area jse-inside svelte-ik1vm9" data-type="insert-selection-area-inside"></div>`
          );
        } else {
          $$renderer2.push('<!--[!-->');
          if (!root) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(
              `<div role="none" class="jse-insert-selection-area jse-after svelte-ik1vm9" data-type="insert-selection-area-after"></div>`
            );
          } else {
            $$renderer2.push('<!--[!-->');
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div> `);
        if (expanded) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<div class="jse-props svelte-ik1vm9">`);
          if (!context.readOnly && isNodeSelected && isInsideSelection(selection)) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(
              `<div${attr_class('jse-insert-area jse-inside svelte-ik1vm9', void 0, {
                'jse-hovered': hover === HOVER_INSERT_INSIDE,
                'jse-selected': isNodeSelected && isInsideSelection(selection)
              })} data-type="insert-selection-area-inside"${attr('title', INSERT_EXPLANATION)}${attr_style('', { '--level': path.length + 1 })}>`
            );
            ContextMenuPointer($$renderer2, {
              insert: true,
              selected: isNodeSelected && isInsideSelection(selection),
              onContextMenu: handleInsertInsideOpenContextMenu
            });
            $$renderer2.push(`<!----></div>`);
          } else {
            $$renderer2.push('<!--[!-->');
          }
          $$renderer2.push(`<!--]--> <!--[-->`);
          const each_array_2 = ensure_array_like(getKeys(value, dragging));
          for (
            let $$index_2 = 0, $$length = each_array_2.length;
            $$index_2 < $$length;
            $$index_2++
          ) {
            let key = each_array_2[$$index_2];
            const propPointer = appendToJSONPointer(pointer, key);
            const nestedSearchResults = isObjectRecursiveState(searchResults)
              ? searchResults.properties[key]
              : void 0;
            const nestedValidationErrors = isObjectRecursiveState(validationErrors)
              ? validationErrors.properties[key]
              : void 0;
            const nestedPath = path.concat(key);
            const nestedSelection = selectionIfOverlapping(
              context.getJson(),
              selection,
              nestedPath
            );
            JSONNode($$renderer2, {
              value: value[key],
              pointer: propPointer,
              state: isObjectRecursiveState(state) ? state.properties[key] : void 0,
              validationErrors: nestedValidationErrors,
              searchResults: nestedSearchResults,
              selection: nestedSelection,
              context,
              onDragSelectionStart: handleDragSelectionStart,
              $$slots: {
                identifier: ($$renderer3) => {
                  $$renderer3.push(
                    `<div slot="identifier"${attr_class('jse-key-outer svelte-ik1vm9', void 0, {
                      'jse-selected-key':
                        isKeySelection(nestedSelection) && isEqual(nestedSelection.path, nestedPath)
                    })}>`
                  );
                  JSONKey($$renderer3, {
                    pointer: propPointer,
                    key,
                    selection: nestedSelection,
                    searchResultItems: filterKeySearchResults(nestedSearchResults),
                    context,
                    onUpdateKey: handleUpdateKey
                  });
                  $$renderer3.push(`<!----></div>`);
                }
              }
            });
            $$renderer2.push(`<!---->`);
          }
          $$renderer2.push(
            `<!--]--></div> <div class="jse-footer-outer svelte-ik1vm9"><div data-type="selectable-value" class="jse-footer svelte-ik1vm9"><div class="jse-bracket svelte-ik1vm9">}</div></div> `
          );
          if (!root) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(
              `<div role="none" class="jse-insert-selection-area jse-after svelte-ik1vm9" data-type="insert-selection-area-after"></div>`
            );
          } else {
            $$renderer2.push('<!--[!-->');
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `<div class="jse-contents-outer svelte-ik1vm9"><div class="jse-contents svelte-ik1vm9"><!--[-->`
        );
        slot($$renderer2, $$props, 'identifier', {}, null);
        $$renderer2.push(`<!--]--> `);
        if (!root) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<div class="jse-separator svelte-ik1vm9">:</div>`);
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--> <div class="jse-value-outer svelte-ik1vm9">`);
        JSONValue($$renderer2, {
          path,
          value,
          enforceString,
          selection: isNodeSelected ? selection : void 0,
          searchResultItems: filterValueSearchResults(searchResults),
          context
        });
        $$renderer2.push(`<!----></div> `);
        if (
          !context.readOnly &&
          isNodeSelected &&
          selection &&
          (isValueSelection(selection) || isMultiSelection(selection)) &&
          !isEditingSelection(selection) &&
          isEqual(getFocusPath(selection), path)
        ) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(`<div class="jse-context-menu-pointer-anchor svelte-ik1vm9">`);
          ContextMenuPointer($$renderer2, {
            root,
            selected: true,
            onContextMenu: context.onContextMenu
          });
          $$renderer2.push(`<!----></div>`);
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--></div> `);
        if (validationError) {
          $$renderer2.push('<!--[-->');
          ValidationErrorIcon($$renderer2, { validationError, onExpand: handleExpand });
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--> `);
        if (!root) {
          $$renderer2.push('<!--[-->');
          $$renderer2.push(
            `<div role="none" class="jse-insert-selection-area jse-after svelte-ik1vm9" data-type="insert-selection-area-after"></div>`
          );
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    if (!context.readOnly && isNodeSelected && isAfterSelection(selection)) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div${attr_class('jse-insert-area jse-after svelte-ik1vm9', void 0, {
          'jse-hovered': hover === HOVER_INSERT_AFTER,
          'jse-selected': isNodeSelected && isAfterSelection(selection)
        })} data-type="insert-selection-area-after"${attr('title', INSERT_EXPLANATION)}>`
      );
      ContextMenuPointer($$renderer2, {
        insert: true,
        selected: isNodeSelected && isAfterSelection(selection),
        onContextMenu: handleInsertAfterOpenContextMenu
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, {
      pointer,
      value,
      state,
      validationErrors,
      searchResults,
      selection,
      context,
      onDragSelectionStart
    });
  });
}
const faJSONEditorExpand = {
  prefix: 'fas',
  iconName: 'jsoneditor-expand',
  icon: [
    512,
    512,
    [],
    '',
    'M 0,448 V 512 h 512 v -64 z M 0,0 V 64 H 512 V 0 Z M 256,96 128,224 h 256 z M 256,416 384,288 H 128 Z'
  ]
};
const faJSONEditorCollapse = {
  prefix: 'fas',
  iconName: 'jsoneditor-collapse',
  icon: [
    512,
    512,
    [],
    '',
    'm 0,224 v 64 h 512 v -64 z M 256,192 384,64 H 128 Z M 256,320 128,448 h 256 z'
  ]
};
const faJSONEditorFormat = {
  prefix: 'fas',
  iconName: 'jsoneditor-format',
  icon: [
    512,
    512,
    [],
    '',
    'M 0,32 v 64 h 416 v -64 z M 160,160 v 64 h 352 v -64 z M 160,288 v 64 h 288 v -64 z M 0,416 v 64 h 320 v -64 z'
  ]
};
const faJSONEditorCompact = {
  prefix: 'fas',
  iconName: 'jsoneditor-compact',
  icon: [
    512,
    512,
    [],
    '',
    'M 0,32 v 64 h 512 v -64 z M 0,160 v 64 h 512 v -64 z M 0,288 v 64 h 352 v -64 z'
  ]
};
function TreeMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let hasJson, hasSelectionContents2, items;
    let json = $$props['json'];
    let selection = $$props['selection'];
    let readOnly = $$props['readOnly'];
    let showSearch = fallback($$props['showSearch'], false);
    let history = $$props['history'];
    let onExpandAll = $$props['onExpandAll'];
    let onCollapseAll = $$props['onCollapseAll'];
    let onUndo = $$props['onUndo'];
    let onRedo = $$props['onRedo'];
    let onSort = $$props['onSort'];
    let onTransform = $$props['onTransform'];
    let onContextMenu = $$props['onContextMenu'];
    let onCopy2 = $$props['onCopy'];
    let onRenderMenu = $$props['onRenderMenu'];
    function handleToggleSearch() {
      showSearch = !showSearch;
    }
    let expandMenuItem;
    let collapseMenuItem;
    let searchMenuItem;
    let defaultItems;
    hasJson = json !== void 0;
    hasSelectionContents2 =
      hasJson &&
      (isMultiSelection(selection) || isKeySelection(selection) || isValueSelection(selection));
    expandMenuItem = {
      type: 'button',
      icon: faJSONEditorExpand,
      title: 'Expand all',
      className: 'jse-expand-all',
      onClick: onExpandAll,
      disabled: !isObjectOrArray(json)
    };
    collapseMenuItem = {
      type: 'button',
      icon: faJSONEditorCollapse,
      title: 'Collapse all',
      className: 'jse-collapse-all',
      onClick: onCollapseAll,
      disabled: !isObjectOrArray(json)
    };
    searchMenuItem = {
      type: 'button',
      icon: faSearch,
      title: 'Search (Ctrl+F)',
      className: 'jse-search',
      onClick: handleToggleSearch,
      disabled: json === void 0
    };
    defaultItems = !readOnly
      ? [
          expandMenuItem,
          collapseMenuItem,
          { type: 'separator' },
          {
            type: 'button',
            icon: faSortAmountDownAlt,
            title: 'Sort',
            className: 'jse-sort',
            onClick: onSort,
            disabled: readOnly || json === void 0
          },
          {
            type: 'button',
            icon: faFilter,
            title: 'Transform contents (filter, sort, project)',
            className: 'jse-transform',
            onClick: onTransform,
            disabled: readOnly || json === void 0
          },
          searchMenuItem,
          {
            type: 'button',
            icon: faEllipsisV,
            title: CONTEXT_MENU_EXPLANATION,
            className: 'jse-contextmenu',
            onClick: onContextMenu
          },
          { type: 'separator' },
          {
            type: 'button',
            icon: faUndo,
            title: 'Undo (Ctrl+Z)',
            className: 'jse-undo',
            onClick: onUndo,
            disabled: !history.canUndo
          },
          {
            type: 'button',
            icon: faRedo,
            title: 'Redo (Ctrl+Shift+Z)',
            className: 'jse-redo',
            onClick: onRedo,
            disabled: !history.canRedo
          },
          { type: 'space' }
        ]
      : [
          expandMenuItem,
          collapseMenuItem,
          { type: 'separator' },
          {
            type: 'button',
            icon: faCopy,
            title: 'Copy (Ctrl+C)',
            className: 'jse-copy',
            onClick: onCopy2,
            disabled: !hasSelectionContents2
          },
          { type: 'separator' },
          searchMenuItem,
          { type: 'space' }
        ];
    items = onRenderMenu(defaultItems) || defaultItems;
    Menu($$renderer2, { items });
    bind_props($$props, {
      json,
      selection,
      readOnly,
      showSearch,
      history,
      onExpandAll,
      onCollapseAll,
      onUndo,
      onRedo,
      onSort,
      onTransform,
      onContextMenu,
      onCopy: onCopy2,
      onRenderMenu
    });
  });
}
function Welcome($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const { readOnly } = $$props;
    $$renderer2.push(
      `<div class="jse-welcome svelte-9kz9uv" role="none"><div class="jse-space jse-before svelte-9kz9uv"></div> <div class="jse-contents svelte-9kz9uv"><div class="jse-welcome-title">Empty document</div> `
    );
    if (!readOnly) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div class="jse-welcome-info svelte-9kz9uv">You can paste clipboard data using <b>Ctrl+V</b>, or use the following options:</div> <button title="Create an empty JSON object (press '{')" class="svelte-9kz9uv">Create object</button> <button title="Create an empty JSON array (press '[')" class="svelte-9kz9uv">Create array</button>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div> <div class="jse-space jse-after svelte-9kz9uv"></div></div>`);
  });
}
function caseInsensitiveNaturalCompare(a, b) {
  const aLower = typeof a === 'string' ? a.toLowerCase() : a;
  const bLower = typeof b === 'string' ? b.toLowerCase() : b;
  return naturalCompare(aLower, bLower);
}
function sortJson(json, rootPath = [], itemPath = [], direction = 1) {
  const value = getIn(json, rootPath);
  if (isJSONArray(value)) {
    if (itemPath === void 0) {
      throw new Error('Cannot sort: no property selected by which to sort the array');
    }
    return sortArray(json, rootPath, itemPath, direction);
  }
  if (isObject$1(value)) {
    return sortObjectKeys(json, rootPath, direction);
  }
  throw new Error('Cannot sort: no array or object');
}
function sortObjectKeys(json, rootPath = [], direction = 1) {
  const object = getIn(json, rootPath);
  const keys = Object.keys(object);
  const sortedKeys = keys.slice();
  sortedKeys.sort((keyA, keyB) => {
    return direction * caseInsensitiveNaturalCompare(keyA, keyB);
  });
  const sortedObject = {};
  sortedKeys.forEach((key) => (sortedObject[key] = object[key]));
  return [
    {
      op: 'replace',
      path: compileJSONPointer(rootPath),
      value: sortedObject
    }
  ];
}
function sortArray(json, rootPath = [], propertyPath = [], direction = 1) {
  const comparator = createObjectComparator(propertyPath, direction);
  const array = getIn(json, rootPath);
  return [
    {
      op: 'replace',
      path: compileJSONPointer(rootPath),
      value: array.slice(0).sort(comparator)
    }
  ];
}
function createObjectComparator(propertyPath, direction) {
  const sortableTypes = { boolean: 0, number: 1, string: 2, undefined: 4 };
  const otherTypes = 3;
  return function comparator(a, b) {
    const valueA = getIn(a, propertyPath);
    const valueB = getIn(b, propertyPath);
    if (typeof valueA !== typeof valueB) {
      const aIndex = sortableTypes[typeof valueA] ?? otherTypes;
      const bIndex = sortableTypes[typeof valueB] ?? otherTypes;
      return aIndex > bIndex ? direction : aIndex < bIndex ? -direction : 0;
    }
    if (typeof valueA === 'number' || typeof valueA === 'boolean') {
      return valueA > valueB ? direction : valueA < valueB ? -direction : 0;
    }
    if (isObjectOrArray(valueA)) {
      return 0;
    }
    return direction * caseInsensitiveNaturalCompare(valueA, valueB);
  };
}
function NavigationBarItem($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let selectedItem;
    const { openAbsolutePopup, closeAbsolutePopup } = getContext('absolute-popup');
    let path = $$props['path'];
    let index = $$props['index'];
    let onSelect = $$props['onSelect'];
    let getItems2 = $$props['getItems'];
    let open = false;
    path.slice(0, index);
    selectedItem = path[index];
    $$renderer2.push(
      `<div class="jse-navigation-bar-item svelte-zm4a8n"><button type="button"${attr_class('jse-navigation-bar-button jse-navigation-bar-arrow svelte-zm4a8n', void 0, { 'jse-open': open })}>`
    );
    Icon($$renderer2, { data: faAngleRight });
    $$renderer2.push(`<!----></button> `);
    if (selectedItem !== void 0) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<button type="button" class="jse-navigation-bar-button svelte-zm4a8n">${escape_html(selectedItem)}</button>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { path, index, onSelect, getItems: getItems2 });
  });
}
function copyToClipBoard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else if (document.queryCommandSupported?.('copy')) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.error(e);
    } finally {
      document.body.removeChild(textarea);
    }
    return Promise.resolve();
  } else {
    console.error('Copy failed.');
    return Promise.resolve();
  }
}
function NavigationBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let path, hasNextItem;
    const debug2 = createDebug('jsoneditor:NavigationBar');
    let json = $$props['json'];
    let selection = $$props['selection'];
    let onSelect = $$props['onSelect'];
    let onError = $$props['onError'];
    let pathParser = $$props['pathParser'];
    let editing = false;
    function scrollToLastItem(path2) {
      setTimeout(() => {});
    }
    function getItems2(path2) {
      debug2('get items for path', path2);
      const node = getIn(json, path2);
      if (Array.isArray(node)) {
        return range(0, node.length).map(String);
      } else if (isObject$1(node)) {
        const keys = Object.keys(node);
        const sortedKeys = keys.slice(0);
        sortedKeys.sort(caseInsensitiveNaturalCompare);
        return sortedKeys;
      } else {
        return [];
      }
    }
    function handleSelect(path2) {
      debug2('select path', JSON.stringify(path2));
      onSelect(createMultiSelection(path2, path2));
    }
    path = selection ? getFocusPath(selection) : [];
    hasNextItem = isObjectOrArray(getIn(json, path));
    scrollToLastItem();
    $$renderer2.push(`<div class="jse-navigation-bar svelte-ch0k1w">`);
    {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(path);
      for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        each_array[index];
        NavigationBarItem($$renderer2, {
          getItems: getItems2,
          path,
          index,
          onSelect: handleSelect
        });
      }
      $$renderer2.push(`<!--]--> `);
      if (hasNextItem) {
        $$renderer2.push('<!--[-->');
        NavigationBarItem($$renderer2, {
          getItems: getItems2,
          path,
          index: path.length,
          onSelect: handleSelect
        });
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--> <button type="button"${attr_class('jse-navigation-bar-edit svelte-ch0k1w', void 0, { flex: !editing, editing: editing })}${attr('title', 'Edit the selected path')}><span class="jse-navigation-bar-space svelte-ch0k1w">${escape_html(!isObjectOrArray(json) && !editing ? 'Navigation bar' : ' ')}</span> `
    );
    Icon($$renderer2, { data: faEdit });
    $$renderer2.push(`<!----></button></div>`);
    bind_props($$props, { json, selection, onSelect, onError, pathParser });
  });
}
function SearchBox($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let resultCount, activeIndex, formattedResultCount;
    const debug2 = createDebug('jsoneditor:SearchBox');
    let json = $$props['json'];
    let documentState = $$props['documentState'];
    let parser = $$props['parser'];
    let showSearch = $$props['showSearch'];
    let showReplace = $$props['showReplace'];
    let readOnly = $$props['readOnly'];
    let columns = $$props['columns'];
    let onSearch = $$props['onSearch'];
    let onFocus = $$props['onFocus'];
    let onPatch = $$props['onPatch'];
    let onClose = $$props['onClose'];
    let text = '';
    let replaceText = '';
    let searching = false;
    let searchResult;
    const applyChangedSearchTextDebounced = debounce(applyChangedSearchText, DEBOUNCE_DELAY);
    const applyChangedJsonDebounced = debounce(applyChangedJson, DEBOUNCE_DELAY);
    async function handleFocus() {
      debug2('handleFocus', searchResult);
      const activeItem = searchResult?.activeItem;
      if (activeItem && json !== void 0) {
        await onFocus(activeItem.path, activeItem.resultIndex);
      }
    }
    async function applyChangedShowSearch(showSearch2) {
      await applySearch(showSearch2, text, json);
    }
    async function applyChangedSearchText(text2) {
      await applySearch(showSearch, text2, json);
      await handleFocus();
    }
    async function applyChangedJson(json2) {
      await applySearch(showSearch, text, json2);
    }
    async function applySearch(showSearch2, text2, json2) {
      if (!showSearch2) {
        if (searchResult) {
          searchResult = void 0;
        }
        return Promise.resolve();
      }
      debug2('applySearch', { showSearch: showSearch2, text: text2 });
      if (text2 === '') {
        debug2('clearing search result');
        if (searchResult !== void 0) {
          searchResult = void 0;
        }
        return Promise.resolve();
      }
      searching = true;
      return new Promise((resolve) => {
        setTimeout(() => {
          const newResultItems = search(text2, json2, { maxResults: MAX_SEARCH_RESULTS, columns });
          searchResult = updateSearchResult(newResultItems, searchResult);
          searching = false;
          resolve();
        });
      });
    }
    resultCount = searchResult?.items?.length || 0;
    activeIndex = searchResult?.activeIndex || 0;
    formattedResultCount =
      resultCount >= MAX_SEARCH_RESULTS ? `${MAX_SEARCH_RESULTS - 1}+` : String(resultCount);
    onSearch(searchResult);
    applyChangedShowSearch(showSearch);
    applyChangedSearchTextDebounced(text);
    applyChangedJsonDebounced(json);
    if (showSearch) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div class="jse-search-box svelte-1yv1wjm"><form class="jse-search-form svelte-1yv1wjm">`
      );
      if (!readOnly) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<button type="button" class="jse-replace-toggle svelte-1yv1wjm" title="Toggle visibility of replace options (Ctrl+H)">`
        );
        Icon($$renderer2, { data: showReplace ? faCaretDown : faCaretRight });
        $$renderer2.push(`<!----></button>`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(
        `<!--]--> <div class="jse-search-contents svelte-1yv1wjm"><div class="jse-search-section svelte-1yv1wjm"><div class="jse-search-icon svelte-1yv1wjm">`
      );
      if (searching) {
        $$renderer2.push('<!--[-->');
        Icon($$renderer2, { data: faCircleNotch, spin: true });
      } else {
        $$renderer2.push('<!--[!-->');
        Icon($$renderer2, { data: faSearch });
      }
      $$renderer2.push(
        `<!--]--></div> <label class="jse-search-input-label svelte-1yv1wjm" about="jse-search input"><input class="jse-search-input svelte-1yv1wjm" title="Enter text to search" type="text" placeholder="Find"${attr('value', text)}/></label> <div${attr_class('jse-search-count svelte-1yv1wjm', void 0, { 'jse-visible': text !== '' })}>${escape_html(activeIndex !== -1 && activeIndex < resultCount ? `${activeIndex + 1}/` : '')}${escape_html(formattedResultCount)}</div> <button type="button" class="jse-search-next svelte-1yv1wjm" title="Go to next search result (Enter)">`
      );
      Icon($$renderer2, { data: faChevronDown });
      $$renderer2.push(
        `<!----></button> <button type="button" class="jse-search-previous svelte-1yv1wjm" title="Go to previous search result (Shift+Enter)">`
      );
      Icon($$renderer2, { data: faChevronUp });
      $$renderer2.push(
        `<!----></button> <button type="button" class="jse-search-clear svelte-1yv1wjm" title="Close search box (Esc)">`
      );
      Icon($$renderer2, { data: faTimes });
      $$renderer2.push(`<!----></button></div> `);
      if (showReplace && !readOnly) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<div class="jse-replace-section svelte-1yv1wjm"><input class="jse-replace-input svelte-1yv1wjm" title="Enter replacement text" type="text" placeholder="Replace"${attr('value', replaceText)}/> <button type="button" title="Replace current occurrence (Ctrl+Enter)" class="svelte-1yv1wjm">Replace</button> <button type="button" title="Replace all occurrences" class="svelte-1yv1wjm">All</button></div>`
        );
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--></div></form></div>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      json,
      documentState,
      parser,
      showSearch,
      showReplace,
      readOnly,
      columns,
      onSearch,
      onFocus,
      onPatch,
      onClose
    });
  });
}
const endOfPath = Symbol('path');
function getColumns(array, flatten, maxSampleCount = Infinity) {
  const merged = {};
  if (Array.isArray(array)) {
    forEachSample(array, maxSampleCount, (item) => {
      if (isObject$1(item)) {
        _recurseObject(item, merged, flatten);
      } else {
        merged[endOfPath] = true;
      }
    });
  }
  const paths = [];
  if (endOfPath in merged) {
    paths.push([]);
  }
  _collectPaths(merged, [], paths, flatten);
  return paths;
}
function _recurseObject(object, merged, flatten) {
  for (const key in object) {
    const value = object[key];
    const valueMerged = merged[key] || (merged[key] = {});
    if (isObject$1(value) && flatten) {
      _recurseObject(value, valueMerged, flatten);
    } else {
      if (valueMerged[endOfPath] === void 0) {
        valueMerged[endOfPath] = true;
      }
    }
  }
}
function _collectPaths(object, parentPath, paths, flatten) {
  for (const key in object) {
    const path = parentPath.concat(key);
    const value = object[key];
    if (value && value[endOfPath] === true) {
      paths.push(path);
    }
    if (isJSONObject(value) && flatten) {
      _collectPaths(value, path, paths, flatten);
    }
  }
}
function maintainColumnOrder(newColumns, previousColumns) {
  const orderedColumns = new Set(previousColumns.map(compileJSONPointer));
  const newColumnsSet = new Set(newColumns.map(compileJSONPointer));
  for (const column of orderedColumns) {
    if (!newColumnsSet.has(column)) {
      orderedColumns.delete(column);
    }
  }
  for (const column of newColumnsSet) {
    if (!orderedColumns.has(column)) {
      orderedColumns.add(column);
    }
  }
  return [...orderedColumns].map(parseJSONPointer);
}
function calculateVisibleSection(
  scrollTop,
  viewPortHeight,
  json,
  itemHeights,
  defaultItemHeight,
  searchBoxOffset,
  margin = 80
) {
  const itemCount = isJSONArray(json) ? json.length : 0;
  const averageItemHeight = calculateAverageItemHeight(itemHeights, defaultItemHeight);
  const viewPortTop = scrollTop - margin;
  const viewPortBottom = viewPortHeight + 2 * margin;
  const getItemHeight = (index) => itemHeights[index] || defaultItemHeight;
  let startIndex = 0;
  let startHeight = searchBoxOffset;
  while (startHeight < viewPortTop && startIndex < itemCount) {
    startHeight += getItemHeight(startIndex);
    startIndex++;
  }
  if (startIndex > 0) {
    startIndex--;
    startHeight -= getItemHeight(startIndex);
  }
  let endIndex = startIndex;
  let visibleHeight = 0;
  while (visibleHeight < viewPortBottom && endIndex < itemCount) {
    visibleHeight += getItemHeight(endIndex);
    endIndex++;
  }
  let endHeight = 0;
  for (let i = endIndex; i < itemCount; i++) {
    endHeight += getItemHeight(i);
  }
  const visibleItems = isJSONArray(json) ? json.slice(startIndex, endIndex) : [];
  return {
    startIndex,
    endIndex,
    startHeight,
    endHeight,
    averageItemHeight,
    visibleHeight,
    visibleItems
  };
}
function calculateAbsolutePosition(path, columns, itemHeights, defaultItemHeight) {
  const { rowIndex } = toTableCellPosition(path, columns);
  let top = 0;
  for (let currentIndex = 0; currentIndex < rowIndex; currentIndex++) {
    top += itemHeights[currentIndex] || defaultItemHeight;
  }
  return top;
}
function calculateAverageItemHeight(itemHeights, defaultItemHeight) {
  const values = Object.values(itemHeights);
  if (isEmpty(values)) {
    return defaultItemHeight;
  }
  const add = (a, b) => a + b;
  const total = values.reduce(add);
  return total / values.length;
}
function toTableCellPosition(path, columns) {
  const [index, ...column] = path;
  const rowIndex = parseInt(index, 10);
  return {
    rowIndex: !isNaN(rowIndex) ? rowIndex : -1,
    columnIndex: columns.findIndex((c) => pathStartsWith(column, c))
  };
}
function fromTableCellPosition(position, columns) {
  const { rowIndex, columnIndex } = position;
  return [String(rowIndex), ...columns[columnIndex]];
}
function groupValidationErrors(validationErrors, columns) {
  const [arrayErrors, rootErrors] = partition(validationErrors, (validationError) =>
    containsNumber(validationError.path[0])
  );
  const errorsByRow = groupBy(arrayErrors, findRowIndex);
  const groupedErrorsByRow = mapValues(errorsByRow, (errors) => {
    const groupByRow = {
      row: [],
      columns: {}
    };
    errors.forEach((error) => {
      const columnIndex = findColumnIndex(error, columns);
      if (columnIndex !== -1) {
        if (groupByRow.columns[columnIndex] === void 0) {
          groupByRow.columns[columnIndex] = [];
        }
        groupByRow.columns[columnIndex].push(error);
      } else {
        groupByRow.row.push(error);
      }
    });
    return groupByRow;
  });
  return {
    root: rootErrors,
    rows: groupedErrorsByRow
  };
}
function mergeValidationErrors(path, validationErrors) {
  if (!validationErrors || validationErrors.length === 0) {
    return void 0;
  }
  if (validationErrors.length === 1) {
    return validationErrors[0];
  }
  return {
    path,
    message:
      'Multiple validation issues: ' +
      validationErrors
        .map((error) => {
          return stringifyJSONPath(error.path) + ' ' + error.message;
        })
        .join(', '),
    severity: ValidationSeverity.warning
  };
}
function findRowIndex(error) {
  return parseInt(error.path[0], 10);
}
function findColumnIndex(error, columns) {
  const position = toTableCellPosition(error.path, columns);
  if (position.columnIndex !== -1) {
    return position.columnIndex;
  }
  return -1;
}
function clearSortedColumnWhenAffectedByOperations(sortedColumn, operations, columms) {
  const mustBeCleared = operations.some((operation) =>
    operationAffectsSortedColumn(sortedColumn, operation, columms)
  );
  return mustBeCleared ? void 0 : sortedColumn;
}
function operationAffectsSortedColumn(sortedColumn, operation, columns) {
  if (!sortedColumn) {
    return false;
  }
  if (operation.op === 'replace') {
    const path = parseJSONPointer(operation.path);
    const { rowIndex, columnIndex } = toTableCellPosition(path, columns);
    const selectedColumnIndex = columns.findIndex((column) => isEqual(column, sortedColumn.path));
    if (rowIndex !== -1 && columnIndex !== -1 && columnIndex !== selectedColumnIndex) {
      return false;
    }
  }
  return true;
}
function findNestedArrays(json, maxLevel = 2) {
  const props = [];
  function recurse(value, path) {
    if (isJSONObject(value) && path.length < maxLevel) {
      Object.keys(value).forEach((key) => {
        recurse(value[key], path.concat(key));
      });
    }
    if (isJSONArray(value)) {
      props.push(path);
    }
  }
  recurse(json, []);
  return props;
}
const debug$1 = createDebug('jsoneditor:actions');
async function onCut({ json, selection, indentation, readOnly, parser, onPatch }) {
  if (readOnly || json === void 0 || !selection || !hasSelectionContents(selection)) {
    return;
  }
  const clipboard = selectionToPartialJson(json, selection, indentation, parser);
  if (clipboard === void 0) {
    return;
  }
  debug$1('cut', { selection, clipboard, indentation });
  await copyToClipBoard(clipboard);
  const { operations, newSelection } = createRemoveOperations(json, selection);
  onPatch(operations, (_, patchedState) => ({
    state: patchedState,
    selection: newSelection
  }));
}
async function onCopy({ json, selection, indentation, parser }) {
  const clipboard = selectionToPartialJson(json, selection, indentation, parser);
  if (clipboard === void 0) {
    return;
  }
  debug$1('copy', { clipboard, indentation });
  await copyToClipBoard(clipboard);
}
function onPaste({
  clipboardText,
  json,
  selection,
  readOnly,
  parser,
  onPatch,
  onChangeText,
  onPasteMultilineText,
  openRepairModal
}) {
  if (readOnly) {
    return;
  }
  function doPaste(pastedText) {
    if (json !== void 0) {
      const ensureSelection = selection || createValueSelection([]);
      const operations = insert(json, ensureSelection, pastedText, parser);
      const pasteMultilineText = isMultilineTextPastedAsArray(clipboardText, operations, parser);
      debug$1('paste', { pastedText, operations, ensureSelection, pasteMultilineText });
      onPatch(operations, (patchedJson, patchedState) => {
        let updatedState = patchedState;
        operations
          .filter(
            (operation) =>
              (isJSONPatchAdd(operation) || isJSONPatchReplace(operation)) &&
              isObjectOrArray(operation.value)
          )
          .forEach((operation) => {
            const path = parsePath(json, operation.path);
            updatedState = expandSmart(patchedJson, updatedState, path);
          });
        return {
          state: updatedState
        };
      });
      if (pasteMultilineText) {
        onPasteMultilineText(pastedText);
      }
    } else {
      debug$1('paste text', { pastedText });
      onChangeText(clipboardText, (patchedJson, patchedState) => {
        if (patchedJson) {
          const path = [];
          return {
            state: expandSmart(patchedJson, patchedState, path)
          };
        }
        return void 0;
      });
    }
  }
  try {
    doPaste(clipboardText);
  } catch {
    openRepairModal(clipboardText, (repairedText) => {
      debug$1('repaired pasted text: ', repairedText);
      doPaste(repairedText);
    });
  }
}
function isMultilineTextPastedAsArray(
  clipboardText,
  operators,
  parser,
  maxSize = MAX_MULTILINE_PASTE_SIZE
) {
  if (clipboardText.length > maxSize) {
    return false;
  }
  const containsNewline = /\n/.test(clipboardText);
  if (!containsNewline) {
    return false;
  }
  const replaceArrayOperation = operators.some(
    (operator) => operator.op === 'replace' && Array.isArray(operator.value)
  );
  const multipleAddOperations = operators.filter((operator) => operator.op === 'add').length > 1;
  const pastingArray = replaceArrayOperation || multipleAddOperations;
  if (!pastingArray) {
    return false;
  }
  try {
    parsePartialJson(clipboardText, parser.parse);
    return false;
  } catch {
    return true;
  }
}
function onRemove({ json, text, selection, keepSelection, readOnly, onChange, onPatch }) {
  if (readOnly || !selection) {
    return;
  }
  const removeSelection =
    json !== void 0 && (isKeySelection(selection) || isValueSelection(selection))
      ? createMultiSelection(selection.path, selection.path)
      : selection;
  if (isEmpty(getFocusPath(selection))) {
    debug$1('remove root', { selection });
    if (onChange) {
      onChange(
        { text: '', json: void 0 },
        json !== void 0 ? { text: void 0, json } : { text: text || '', json },
        {
          contentErrors: void 0,
          patchResult: void 0
        }
      );
    }
  } else {
    if (json !== void 0) {
      const { operations, newSelection } = createRemoveOperations(json, removeSelection);
      debug$1('remove', { operations, selection, newSelection });
      onPatch(operations, (_, patchedState) => ({
        state: patchedState,
        selection: keepSelection ? selection : newSelection
      }));
    }
  }
}
function onDuplicateRow({ json, selection, columns, readOnly, onPatch }) {
  if (readOnly || json === void 0 || !selection || !hasSelectionContents(selection)) {
    return;
  }
  const { rowIndex, columnIndex } = toTableCellPosition(getFocusPath(selection), columns);
  debug$1('duplicate row', { rowIndex });
  const rowPath = [String(rowIndex)];
  const operations = duplicate(json, [rowPath]);
  onPatch(operations, (_, patchedState) => {
    const newRowIndex = rowIndex < json.length ? rowIndex + 1 : rowIndex;
    const newPath = fromTableCellPosition({ rowIndex: newRowIndex, columnIndex }, columns);
    const newSelection = createValueSelection(newPath);
    return {
      state: patchedState,
      selection: newSelection
    };
  });
}
function onInsertBeforeRow({ json, selection, columns, readOnly, onPatch }) {
  if (readOnly || json === void 0 || !selection || !hasSelectionContents(selection)) {
    return;
  }
  const { rowIndex } = toTableCellPosition(getFocusPath(selection), columns);
  debug$1('insert before row', { rowIndex });
  const rowPath = [String(rowIndex)];
  const newValue = isJSONObject(json[0]) ? {} : '';
  const values = [{ key: '', value: newValue }];
  const operations = insertBefore(json, rowPath, values);
  onPatch(operations);
}
function onInsertAfterRow({ json, selection, columns, readOnly, onPatch }) {
  if (readOnly || json === void 0 || !selection || !hasSelectionContents(selection)) {
    return;
  }
  const { rowIndex, columnIndex } = toTableCellPosition(getFocusPath(selection), columns);
  debug$1('insert after row', { rowIndex });
  const nextRowIndex = rowIndex + 1;
  const nextRowPath = [String(nextRowIndex)];
  const newValue = isJSONObject(json[0]) ? {} : '';
  const values = [{ key: '', value: newValue }];
  const operations =
    nextRowIndex < json.length ? insertBefore(json, nextRowPath, values) : append(json, [], values);
  onPatch(operations, (_, patchedState) => {
    const nextPath = fromTableCellPosition({ rowIndex: nextRowIndex, columnIndex }, columns);
    const newSelection = createValueSelection(nextPath);
    return {
      state: patchedState,
      selection: newSelection
    };
  });
}
function onRemoveRow({ json, selection, columns, readOnly, onPatch }) {
  if (readOnly || json === void 0 || !selection || !hasSelectionContents(selection)) {
    return;
  }
  const { rowIndex, columnIndex } = toTableCellPosition(getFocusPath(selection), columns);
  debug$1('remove row', { rowIndex });
  const rowPath = [String(rowIndex)];
  const operations = removeAll([rowPath]);
  onPatch(operations, (patchedJson, patchedState) => {
    const newRowIndex =
      rowIndex < patchedJson.length ? rowIndex : rowIndex > 0 ? rowIndex - 1 : void 0;
    const newSelection =
      newRowIndex !== void 0
        ? createValueSelection(
            fromTableCellPosition({ rowIndex: newRowIndex, columnIndex }, columns)
          )
        : void 0;
    debug$1('remove row new selection', { rowIndex, newRowIndex, newSelection });
    return {
      state: patchedState,
      selection: newSelection
    };
  });
}
function onInsert({
  insertType,
  selectInside,
  initialValue,
  json,
  selection,
  readOnly,
  parser,
  onPatch,
  onReplaceJson
}) {
  if (readOnly) {
    return;
  }
  const newValue = createNewValue(json, selection, insertType);
  if (json !== void 0) {
    const data = parser.stringify(newValue);
    const operations = insert(json, selection, data, parser);
    debug$1('onInsert', { insertType, operations, newValue, data });
    const operation = last(
      operations.filter((operation2) => operation2.op === 'add' || operation2.op === 'replace')
    );
    onPatch(operations, (patchedJson, patchedState, patchedSelection) => {
      if (operation) {
        const path = parsePath(patchedJson, operation.path);
        if (isObjectOrArray(newValue)) {
          return {
            state: expandPath(patchedJson, patchedState, path, expandAll),
            selection: createInsideSelection(path)
          };
        }
        if (newValue === '') {
          const parent = !isEmpty(path) ? getIn(patchedJson, initial(path)) : void 0;
          return {
            state: expandPath(patchedJson, patchedState, path, expandNone),
            selection: isObject$1(parent)
              ? createEditKeySelection(path, initialValue)
              : createEditValueSelection(path, initialValue)
          };
        }
      }
      return void 0;
    });
    debug$1('after patch');
  } else {
    debug$1('onInsert', { insertType, newValue });
    const path = [];
    onReplaceJson(newValue, (patchedJson, patchedState) => ({
      state: expandSmart(patchedJson, patchedState, path),
      selection: isObjectOrArray(newValue)
        ? createInsideSelection(path)
        : createEditValueSelection(path)
    }));
  }
}
function JSONPreview($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let content, truncated;
    let text = $$props['text'];
    let json = $$props['json'];
    let indentation = $$props['indentation'];
    let parser = $$props['parser'];
    content = json !== void 0 ? { json } : { text: text || '' };
    truncated = truncate(getText(content, indentation, parser), MAX_CHARACTERS_TEXT_PREVIEW);
    $$renderer2.push(`<div class="jse-json-preview svelte-6s14j1">${escape_html(truncated)}</div>`);
    bind_props($$props, { text, json, indentation, parser });
  });
}
function ContextMenuButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let item = $$props['item'];
    let className = fallback($$props['className'], void 0);
    let onRequestClose = $$props['onRequestClose'];
    $$renderer2.push(
      `<button type="button"${attr_class(clsx$1(classnames('jse-context-menu-button', className, item.className)), 'svelte-1nv9wlw')}${attr('title', item.title)}${attr('disabled', item.disabled || false, true)}>`
    );
    if (item.icon) {
      $$renderer2.push('<!--[-->');
      Icon($$renderer2, { data: item.icon });
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> `);
    if (item.text) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`${escape_html(item.text)}`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></button>`);
    bind_props($$props, { item, className, onRequestClose });
  });
}
function DropdownButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let allItemsDisabled;
    let items = fallback($$props['items'], () => [], true);
    let title = fallback($$props['title'], void 0);
    let width = fallback($$props['width'], '120px');
    let visible = false;
    function handleClick() {
      visible = false;
    }
    function handleKeyDown(event) {
      const combo = keyComboFromEvent(event);
      if (combo === 'Escape') {
        event.preventDefault();
        visible = false;
      }
    }
    onDestroy(() => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    });
    allItemsDisabled = items.every((item) => item.disabled === true);
    $$renderer2.push(
      `<div role="button" tabindex="0" class="jse-dropdown-button svelte-1i0a0jw"${attr('title', title)}><!--[-->`
    );
    slot($$renderer2, $$props, 'defaultItem', {}, null);
    $$renderer2.push(
      `<!--]--> <button type="button"${attr_class('jse-open-dropdown svelte-1i0a0jw', void 0, { 'jse-visible': visible })} data-type="jse-open-dropdown"${attr('disabled', allItemsDisabled, true)}>`
    );
    Icon($$renderer2, { data: faCaretDown });
    $$renderer2.push(
      `<!----></button> <div${attr_class('jse-dropdown-items svelte-1i0a0jw', void 0, { 'jse-visible': visible })}${attr_style(`width: ${stringify$1(width)};`)}><ul class="svelte-1i0a0jw"><!--[-->`
    );
    const each_array = ensure_array_like(items);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(
        `<li class="svelte-1i0a0jw"><button type="button"${attr('title', item.title)}${attr('disabled', item.disabled, true)}${attr_class(clsx$1(item.className), 'svelte-1i0a0jw')}>`
      );
      if (item.icon) {
        $$renderer2.push('<!--[-->');
        Icon($$renderer2, { data: item.icon });
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--> ${escape_html(item.text)}</button></li>`);
    }
    $$renderer2.push(`<!--]--></ul></div></div>`);
    bind_props($$props, { items, title, width });
  });
}
function ContextMenuDropDownButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let items;
    let item = $$props['item'];
    let className = fallback($$props['className'], void 0);
    let onRequestClose = $$props['onRequestClose'];
    items = item.items.map((item2) => ({
      ...item2,
      onClick: (event) => {
        onRequestClose();
        item2.onClick(event);
      }
    }));
    DropdownButton($$renderer2, {
      width: item.width,
      items,
      $$slots: {
        defaultItem: ($$renderer3) => {
          $$renderer3.push(
            `<button${attr_class(clsx$1(classnames('jse-context-menu-button', className, item.main.className)), 'svelte-16zcttp')} type="button" slot="defaultItem"${attr('title', item.main.title)}${attr('disabled', item.main.disabled || false, true)}>`
          );
          if (item.main.icon) {
            $$renderer3.push('<!--[-->');
            Icon($$renderer3, { data: item.main.icon });
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> ${escape_html(item.main.text)}</button>`);
        }
      }
    });
    bind_props($$props, { item, className, onRequestClose });
  });
}
function ContextMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let items = $$props['items'];
    let onRequestClose = $$props['onRequestClose'];
    let tip = $$props['tip'];
    function unknownMenuItem(item) {
      console.error('Unknown type of context menu item', item);
      return '???';
    }
    $$renderer2.push(
      `<div role="menu" tabindex="-1" class="jse-contextmenu svelte-196mxz0"><!--[-->`
    );
    const each_array = ensure_array_like(items);
    for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
      let item = each_array[$$index_2];
      if (isMenuButton(item)) {
        $$renderer2.push('<!--[-->');
        ContextMenuButton($$renderer2, { item, onRequestClose });
      } else {
        $$renderer2.push('<!--[!-->');
        if (isMenuDropDownButton(item)) {
          $$renderer2.push('<!--[-->');
          ContextMenuDropDownButton($$renderer2, { item, onRequestClose });
        } else {
          $$renderer2.push('<!--[!-->');
          if (isContextMenuRow(item)) {
            $$renderer2.push('<!--[-->');
            $$renderer2.push(`<div class="jse-row svelte-196mxz0"><!--[-->`);
            const each_array_1 = ensure_array_like(item.items);
            for (
              let $$index_1 = 0, $$length2 = each_array_1.length;
              $$index_1 < $$length2;
              $$index_1++
            ) {
              let rowItem = each_array_1[$$index_1];
              if (isMenuButton(rowItem)) {
                $$renderer2.push('<!--[-->');
                ContextMenuButton($$renderer2, { item: rowItem, onRequestClose });
              } else {
                $$renderer2.push('<!--[!-->');
                if (isMenuDropDownButton(rowItem)) {
                  $$renderer2.push('<!--[-->');
                  ContextMenuDropDownButton($$renderer2, { item: rowItem, onRequestClose });
                } else {
                  $$renderer2.push('<!--[!-->');
                  if (isContextMenuColumn(rowItem)) {
                    $$renderer2.push('<!--[-->');
                    $$renderer2.push(`<div class="jse-column svelte-196mxz0"><!--[-->`);
                    const each_array_2 = ensure_array_like(rowItem.items);
                    for (
                      let $$index = 0, $$length3 = each_array_2.length;
                      $$index < $$length3;
                      $$index++
                    ) {
                      let columnItem = each_array_2[$$index];
                      if (isMenuButton(columnItem)) {
                        $$renderer2.push('<!--[-->');
                        ContextMenuButton($$renderer2, {
                          className: 'left',
                          item: columnItem,
                          onRequestClose
                        });
                      } else {
                        $$renderer2.push('<!--[!-->');
                        if (isMenuDropDownButton(columnItem)) {
                          $$renderer2.push('<!--[-->');
                          ContextMenuDropDownButton($$renderer2, {
                            className: 'left',
                            item: columnItem,
                            onRequestClose
                          });
                        } else {
                          $$renderer2.push('<!--[!-->');
                          if (isMenuSeparator(columnItem)) {
                            $$renderer2.push('<!--[-->');
                            $$renderer2.push(`<div class="jse-separator svelte-196mxz0"></div>`);
                          } else {
                            $$renderer2.push('<!--[!-->');
                            if (isMenuLabel(columnItem)) {
                              $$renderer2.push('<!--[-->');
                              $$renderer2.push(
                                `<div class="jse-label svelte-196mxz0">${escape_html(columnItem.text)}</div>`
                              );
                            } else {
                              $$renderer2.push('<!--[!-->');
                              $$renderer2.push(`${escape_html(unknownMenuItem(columnItem))}`);
                            }
                            $$renderer2.push(`<!--]-->`);
                          }
                          $$renderer2.push(`<!--]-->`);
                        }
                        $$renderer2.push(`<!--]-->`);
                      }
                      $$renderer2.push(`<!--]-->`);
                    }
                    $$renderer2.push(`<!--]--></div>`);
                  } else {
                    $$renderer2.push('<!--[!-->');
                    if (isMenuSeparator(rowItem)) {
                      $$renderer2.push('<!--[-->');
                      $$renderer2.push(`<div class="jse-separator svelte-196mxz0"></div>`);
                    } else {
                      $$renderer2.push('<!--[!-->');
                      $$renderer2.push(`${escape_html(unknownMenuItem(rowItem))}`);
                    }
                    $$renderer2.push(`<!--]-->`);
                  }
                  $$renderer2.push(`<!--]-->`);
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push('<!--[!-->');
            if (isMenuSeparator(item)) {
              $$renderer2.push('<!--[-->');
              $$renderer2.push(`<div class="jse-separator svelte-196mxz0"></div>`);
            } else {
              $$renderer2.push('<!--[!-->');
              $$renderer2.push(`${escape_html(unknownMenuItem(item))}`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    if (tip) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div class="jse-row svelte-196mxz0"><div class="jse-tip svelte-196mxz0"><div class="jse-tip-icon svelte-196mxz0">`
      );
      Icon($$renderer2, { data: faLightbulb });
      $$renderer2.push(
        `<!----></div> <div class="jse-tip-text">${escape_html(tip)}</div></div></div>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { items, onRequestClose, tip });
  });
}
function createTreeContextMenuItems({
  json,
  documentState,
  selection,
  readOnly,
  onEditKey,
  onEditValue,
  onToggleEnforceString,
  onCut: onCut2,
  onCopy: onCopy2,
  onPaste: onPaste2,
  onRemove: onRemove2,
  onDuplicate,
  onExtract,
  onInsertBefore,
  onInsert: onInsert2,
  onConvert,
  onInsertAfter,
  onSort,
  onTransform
}) {
  const hasJson = json !== void 0;
  const hasSelection = !!selection;
  const rootSelected = selection ? isEmpty(getFocusPath(selection)) : false;
  const focusValue = selection ? getIn(json, getFocusPath(selection)) : void 0;
  const editValueText = Array.isArray(focusValue)
    ? 'Edit array'
    : isObject$1(focusValue)
      ? 'Edit object'
      : 'Edit value';
  const hasSelectionContents2 =
    hasJson &&
    (isMultiSelection(selection) || isKeySelection(selection) || isValueSelection(selection));
  const parent =
    selection && !rootSelected ? getIn(json, initial(getFocusPath(selection))) : void 0;
  const canEditKey =
    !readOnly &&
    hasJson &&
    singleItemSelected(selection) &&
    !rootSelected &&
    !Array.isArray(parent);
  const canEditValue =
    !readOnly && hasJson && selection !== void 0 && singleItemSelected(selection);
  const canEnforceString = canEditValue && !isObjectOrArray(focusValue);
  const canCut = !readOnly && hasSelectionContents2;
  const canCopy = hasSelectionContents2;
  const canPaste = !readOnly && hasSelection;
  const canDuplicate = !readOnly && hasJson && hasSelectionContents2 && !rootSelected;
  const canExtract =
    !readOnly &&
    hasJson &&
    selection !== void 0 &&
    (isMultiSelection(selection) || isValueSelection(selection)) &&
    !rootSelected;
  const convertMode = hasSelectionContents2;
  const insertOrConvertText = convertMode ? 'Convert to:' : 'Insert:';
  const canInsertOrConvertStructure =
    !readOnly &&
    ((isInsideSelection(selection) && Array.isArray(focusValue)) ||
      (isAfterSelection(selection) && Array.isArray(parent)));
  const canInsertOrConvertObject =
    !readOnly && (convertMode ? canConvert(selection) && !isObject$1(focusValue) : hasSelection);
  const canInsertOrConvertArray =
    !readOnly && (convertMode ? canConvert(selection) && !Array.isArray(focusValue) : hasSelection);
  const canInsertOrConvertValue =
    !readOnly &&
    (convertMode ? canConvert(selection) && isObjectOrArray(focusValue) : hasSelection);
  const enforceString =
    selection !== void 0 ? getEnforceString(json, documentState, getFocusPath(selection)) : false;
  function handleInsertOrConvert(type) {
    if (hasSelectionContents2) {
      if (type !== 'structure') {
        onConvert(type);
      }
    } else {
      onInsert2(type);
    }
  }
  return [
    {
      type: 'row',
      items: [
        {
          type: 'button',
          onClick: () => onEditKey(),
          icon: faPen,
          text: 'Edit key',
          title: 'Edit the key (Double-click on the key)',
          disabled: !canEditKey
        },
        {
          type: 'dropdown-button',
          main: {
            type: 'button',
            onClick: () => onEditValue(),
            icon: faPen,
            text: editValueText,
            title: 'Edit the value (Double-click on the value)',
            disabled: !canEditValue
          },
          width: '11em',
          items: [
            {
              type: 'button',
              icon: faPen,
              text: editValueText,
              title: 'Edit the value (Double-click on the value)',
              onClick: () => onEditValue(),
              disabled: !canEditValue
            },
            {
              type: 'button',
              icon: enforceString ? faCheckSquare$1 : faSquare$1,
              text: 'Enforce string',
              title: 'Enforce keeping the value as string when it contains a numeric value',
              onClick: () => onToggleEnforceString(),
              disabled: !canEnforceString
            }
          ]
        }
      ]
    },
    { type: 'separator' },
    {
      type: 'row',
      items: [
        {
          type: 'dropdown-button',
          main: {
            type: 'button',
            onClick: () => onCut2(true),
            icon: faCut,
            text: 'Cut',
            title: 'Cut selected contents, formatted with indentation (Ctrl+X)',
            disabled: !canCut
          },
          width: '10em',
          items: [
            {
              type: 'button',
              icon: faCut,
              text: 'Cut formatted',
              title: 'Cut selected contents, formatted with indentation (Ctrl+X)',
              onClick: () => onCut2(true),
              disabled: !canCut
            },
            {
              type: 'button',
              icon: faCut,
              text: 'Cut compacted',
              title: 'Cut selected contents, without indentation (Ctrl+Shift+X)',
              onClick: () => onCut2(false),
              disabled: !canCut
            }
          ]
        },
        {
          type: 'dropdown-button',
          main: {
            type: 'button',
            onClick: () => onCopy2(true),
            icon: faCopy,
            text: 'Copy',
            title: 'Copy selected contents, formatted with indentation (Ctrl+C)',
            disabled: !canCopy
          },
          width: '12em',
          items: [
            {
              type: 'button',
              icon: faCopy,
              text: 'Copy formatted',
              title: 'Copy selected contents, formatted with indentation (Ctrl+C)',
              onClick: () => onCopy2(true),
              disabled: !canCopy
            },
            {
              type: 'button',
              icon: faCopy,
              text: 'Copy compacted',
              title: 'Copy selected contents, without indentation (Ctrl+Shift+C)',
              onClick: () => onCopy2(false),
              disabled: !canCopy
            }
          ]
        },
        {
          type: 'button',
          onClick: () => onPaste2(),
          icon: faPaste,
          text: 'Paste',
          title: 'Paste clipboard contents (Ctrl+V)',
          disabled: !canPaste
        }
      ]
    },
    { type: 'separator' },
    {
      type: 'row',
      items: [
        {
          type: 'column',
          items: [
            {
              type: 'button',
              onClick: () => onDuplicate(),
              icon: faClone,
              text: 'Duplicate',
              title: 'Duplicate selected contents (Ctrl+D)',
              disabled: !canDuplicate
            },
            {
              type: 'button',
              onClick: () => onExtract(),
              icon: faCropAlt,
              text: 'Extract',
              title: 'Extract selected contents',
              disabled: !canExtract
            },
            {
              type: 'button',
              onClick: () => onSort(),
              icon: faSortAmountDownAlt,
              text: 'Sort',
              title: 'Sort array or object contents',
              disabled: readOnly || !hasSelectionContents2
            },
            {
              type: 'button',
              onClick: () => onTransform(),
              icon: faFilter,
              text: 'Transform',
              title: 'Transform array or object contents (filter, sort, project)',
              disabled: readOnly || !hasSelectionContents2
            },
            {
              type: 'button',
              onClick: () => onRemove2(),
              icon: faTrashCan,
              text: 'Remove',
              title: 'Remove selected contents (Delete)',
              disabled: readOnly || !hasSelectionContents2
            }
          ]
        },
        {
          type: 'column',
          items: [
            { type: 'label', text: insertOrConvertText },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('structure'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: 'Structure',
              title: insertOrConvertText + ' structure like the first item in the array',
              disabled: !canInsertOrConvertStructure
            },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('object'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: 'Object',
              title: insertOrConvertText + ' object',
              disabled: !canInsertOrConvertObject
            },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('array'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: 'Array',
              title: insertOrConvertText + ' array',
              disabled: !canInsertOrConvertArray
            },
            {
              type: 'button',
              onClick: () => handleInsertOrConvert('value'),
              icon: convertMode ? faArrowRightArrowLeft : faPlus,
              text: 'Value',
              title: insertOrConvertText + ' value',
              disabled: !canInsertOrConvertValue
            }
          ]
        }
      ]
    },
    {
      type: 'separator'
    },
    {
      type: 'row',
      items: [
        {
          type: 'button',
          onClick: () => onInsertBefore(),
          icon: faCaretSquareUp,
          text: 'Insert before',
          title: 'Select area before current entry to insert or paste contents',
          disabled: readOnly || !hasSelectionContents2 || rootSelected
        },
        {
          type: 'button',
          onClick: () => onInsertAfter(),
          icon: faCaretSquareDown,
          text: 'Insert after',
          title: 'Select area after current entry to insert or paste contents',
          disabled: readOnly || !hasSelectionContents2 || rootSelected
        }
      ]
    }
  ];
}
function TreeMode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let autoScrollHandler;
    const debug2 = createDebug('jsoneditor:TreeMode');
    const isSSR = typeof window === 'undefined';
    debug2('isSSR:', isSSR);
    const sortModalId = uniqueId$1();
    const transformModalId = uniqueId$1();
    const { openAbsolutePopup, closeAbsolutePopup } = getContext('absolute-popup');
    let refContents;
    let refJsonEditor;
    let readOnly = $$props['readOnly'];
    let externalContent = $$props['externalContent'];
    let externalSelection = $$props['externalSelection'];
    let history = $$props['history'];
    let truncateTextSize = $$props['truncateTextSize'];
    let mainMenuBar = $$props['mainMenuBar'];
    let navigationBar = $$props['navigationBar'];
    let escapeControlCharacters = $$props['escapeControlCharacters'];
    let escapeUnicodeCharacters = $$props['escapeUnicodeCharacters'];
    let parser = $$props['parser'];
    let parseMemoizeOne = $$props['parseMemoizeOne'];
    let validator = $$props['validator'];
    let validationParser = $$props['validationParser'];
    let pathParser = $$props['pathParser'];
    let indentation = $$props['indentation'];
    let onError = $$props['onError'];
    let onChange = $$props['onChange'];
    let onChangeMode = $$props['onChangeMode'];
    let onSelect = $$props['onSelect'];
    let onUndo = $$props['onUndo'];
    let onRedo = $$props['onRedo'];
    let onRenderValue = $$props['onRenderValue'];
    let onRenderMenu = $$props['onRenderMenu'];
    let onRenderContextMenu = $$props['onRenderContextMenu'];
    let onClassName = $$props['onClassName'];
    let onFocus = $$props['onFocus'];
    let onBlur = $$props['onBlur'];
    let onSortModal = $$props['onSortModal'];
    let onTransformModal = $$props['onTransformModal'];
    let onJSONEditorModal = $$props['onJSONEditorModal'];
    let modalOpen = false;
    let copyPasteModalOpen = false;
    let jsonRepairModalProps = void 0;
    createFocusTracker({
      onMount: noop$2,
      onDestroy,
      getWindow: () => getWindow(refJsonEditor),
      hasFocus: () => (modalOpen && document.hasFocus()) || activeElementIsChildOf(refJsonEditor),
      onFocus: () => {
        if (onFocus) {
          onFocus();
        }
      },
      onBlur: () => {
        if (onBlur) {
          onBlur();
        }
      }
    });
    let json;
    let text;
    let parseError = void 0;
    let documentStateInitialized = false;
    let documentState = createDocumentState({ json });
    let selection = isJSONSelection(externalSelection) ? externalSelection : void 0;
    function handleSelect(updatedSelection) {
      selection = updatedSelection;
    }
    function emitOnSelect(updatedSelection) {
      if (!isEqual(updatedSelection, externalSelection)) {
        debug2('onSelect', updatedSelection);
        onSelect(updatedSelection);
      }
    }
    let normalization;
    let pastedJson;
    let pastedMultilineText;
    let searchResultDetails;
    let searchResults;
    let showSearch = false;
    let showReplace = false;
    function handleSearch(result) {
      searchResultDetails = result;
      searchResults = searchResultDetails
        ? toRecursiveSearchResults(json, searchResultDetails.items)
        : void 0;
    }
    async function handleFocusSearch(path, resultIndex) {
      documentState = expandPath(json, documentState, path, expandNone);
      const element2 = findSearchResult();
      await scrollTo(path, { element: element2 });
    }
    function handleCloseSearch() {
      showSearch = false;
      showReplace = false;
      focus();
    }
    function handleSelectValidationError(error) {
      debug2('select validation error', error);
      selection = createValueSelection(error.path);
      scrollTo(error.path);
    }
    function expand(path, callback = expandSelf) {
      debug2('expand');
      documentState = expandPath(json, documentState, path, callback);
    }
    function collapse(path, recursive) {
      documentState = collapsePath(json, documentState, path, recursive);
      if (selection) {
        if (isSelectionInsidePath(selection, path)) {
          selection = void 0;
        }
      }
    }
    let textIsRepaired = false;
    let validationErrorList = [];
    let validationErrors;
    const memoizedValidate = memoizeOne(validateJSON);
    function updateValidationErrors(json2, validator2, parser2, validationParser2) {
      measure(
        () => {
          let newValidationErrorList;
          try {
            newValidationErrorList = memoizedValidate(
              json2,
              validator2,
              parser2,
              validationParser2
            );
          } catch (err) {
            newValidationErrorList = [
              {
                path: [],
                message: 'Failed to validate: ' + err.message,
                severity: ValidationSeverity.warning
              }
            ];
          }
          if (!isEqual(newValidationErrorList, validationErrorList)) {
            debug2('validationErrors changed:', newValidationErrorList);
            validationErrorList = newValidationErrorList;
            validationErrors = toRecursiveValidationErrors(json2, validationErrorList);
          }
        },
        (duration) => debug2(`validationErrors updated in ${duration} ms`)
      );
    }
    function validate() {
      debug2('validate');
      if (parseError) {
        return {
          parseError,
          isRepairable: false
          // not applicable, if repairable, we will not have a parseError
        };
      }
      updateValidationErrors(json, validator, parser, validationParser);
      return !isEmpty(validationErrorList) ? { validationErrors: validationErrorList } : void 0;
    }
    function getJson() {
      return json;
    }
    function getDocumentState() {
      return documentState;
    }
    function getSelection() {
      return selection;
    }
    function applyExternalContent(updatedContent) {
      debug2('applyExternalContent', { updatedContent });
      if (isJSONContent(updatedContent)) {
        applyExternalJson(updatedContent.json);
      } else if (isTextContent(updatedContent)) {
        applyExternalText(updatedContent.text);
      }
    }
    function applyExternalJson(updatedJson) {
      if (updatedJson === void 0) {
        return;
      }
      const isChanged = !isEqual(json, updatedJson);
      debug2('update external json', { isChanged, currentlyText: json === void 0 });
      if (!isChanged) {
        return;
      }
      const previousState = { documentState, selection, json, text, textIsRepaired };
      json = updatedJson;
      documentState = syncDocumentState(updatedJson, documentState);
      expandWhenNotInitialized(json);
      text = void 0;
      textIsRepaired = false;
      parseError = void 0;
      clearSelectionWhenNotExisting(json);
      addHistoryItem(previousState);
    }
    function applyExternalText(updatedText) {
      if (updatedText === void 0 || isJSONContent(externalContent)) {
        return;
      }
      const isChanged = updatedText !== text;
      debug2('update external text', { isChanged });
      if (!isChanged) {
        return;
      }
      const previousState = { documentState, selection, json, text, textIsRepaired };
      try {
        json = parseMemoizeOne(updatedText);
        documentState = syncDocumentState(json, documentState);
        expandWhenNotInitialized(json);
        text = updatedText;
        textIsRepaired = false;
        parseError = void 0;
      } catch (err) {
        try {
          json = parseMemoizeOne(jsonrepair(updatedText));
          documentState = syncDocumentState(json, documentState);
          expandWhenNotInitialized(json);
          text = updatedText;
          textIsRepaired = true;
          parseError = void 0;
          clearSelectionWhenNotExisting(json);
        } catch {
          json = void 0;
          documentState = void 0;
          text = externalContent['text'];
          textIsRepaired = false;
          parseError =
            text !== void 0 && text !== ''
              ? normalizeJsonParseError(text, err.message || String(err))
              : void 0;
        }
      }
      clearSelectionWhenNotExisting(json);
      addHistoryItem(previousState);
    }
    function applyExternalSelection(externalSelection2) {
      if (isEqual(selection, externalSelection2)) {
        return;
      }
      debug2('applyExternalSelection', { selection, externalSelection: externalSelection2 });
      if (isJSONSelection(externalSelection2)) {
        selection = externalSelection2;
      }
    }
    function expandWhenNotInitialized(json2) {
      if (!documentStateInitialized) {
        documentStateInitialized = true;
        documentState = expandSmart(json2, documentState, []);
      }
    }
    function clearSelectionWhenNotExisting(json2) {
      if (!selection) {
        return;
      }
      if (existsIn(json2, getAnchorPath(selection)) && existsIn(json2, getFocusPath(selection))) {
        return;
      }
      debug2('clearing selection: path does not exist anymore', selection);
      selection = getInitialSelection(json2, documentState);
    }
    function addHistoryItem(previous) {
      if (previous.json === void 0 && previous.text === void 0) {
        return;
      }
      const canPatch = json !== void 0 && previous.json !== void 0;
      history.add({
        type: 'tree',
        undo: {
          patch: canPatch ? [{ op: 'replace', path: '', value: previous.json }] : void 0,
          json: previous.json,
          text: previous.text,
          documentState: previous.documentState,
          textIsRepaired: previous.textIsRepaired,
          selection: removeEditModeFromSelection(previous.selection),
          sortedColumn: void 0
        },
        redo: {
          patch: canPatch ? [{ op: 'replace', path: '', value: json }] : void 0,
          json,
          text,
          documentState,
          textIsRepaired,
          selection: removeEditModeFromSelection(selection),
          sortedColumn: void 0
        }
      });
    }
    function patch(operations, afterPatch) {
      debug2('patch', operations, afterPatch);
      if (json === void 0) {
        throw new Error('Cannot apply patch: no JSON');
      }
      const previousJson = json;
      const previousState = {
        json: void 0,
        // not needed: we use patch to reconstruct the json
        text,
        documentState,
        selection: removeEditModeFromSelection(selection),
        textIsRepaired,
        sortedColumn: void 0
      };
      const undo = revertJSONPatchWithMoveOperations(json, operations);
      const patched = documentStatePatch(json, documentState, operations);
      const updatedSelection = createSelectionFromOperations(json, operations) ?? selection;
      const callback =
        typeof afterPatch === 'function'
          ? afterPatch(patched.json, patched.documentState, updatedSelection)
          : void 0;
      json = callback?.json !== void 0 ? callback.json : patched.json;
      documentState = callback?.state !== void 0 ? callback.state : patched.documentState;
      selection = callback?.selection !== void 0 ? callback.selection : updatedSelection;
      text = void 0;
      textIsRepaired = false;
      pastedJson = void 0;
      pastedMultilineText = void 0;
      parseError = void 0;
      clearSelectionWhenNotExisting(json);
      history.add({
        type: 'tree',
        undo: { patch: undo, ...previousState },
        redo: {
          patch: operations,
          json: void 0,
          // not needed, we use patch to reconstruct
          text,
          documentState,
          selection: removeEditModeFromSelection(selection),
          sortedColumn: void 0,
          textIsRepaired
        }
      });
      return { json, previousJson, undo, redo: operations };
    }
    function handleEditKey() {
      if (readOnly || !selection) {
        return;
      }
      selection = createEditKeySelection(getFocusPath(selection));
    }
    function handleEditValue() {
      if (readOnly || !selection) {
        return;
      }
      const path = getFocusPath(selection);
      const value = getIn(json, path);
      if (isObjectOrArray(value)) {
        openJSONEditorModal(path, value);
      } else {
        selection = createEditValueSelection(path);
      }
    }
    function handleToggleEnforceString() {
      if (readOnly || !isValueSelection(selection)) {
        return;
      }
      const path = getFocusPath(selection);
      const pointer = compileJSONPointer(path);
      const value = getIn(json, path);
      const enforceString = !getEnforceString(json, documentState, path);
      const updatedValue = enforceString ? String(value) : stringConvert(String(value), parser);
      debug2('handleToggleEnforceString', { enforceString, value, updatedValue });
      handlePatch([{ op: 'replace', path: pointer, value: updatedValue }], (_, patchedState) => {
        return {
          state: setInDocumentState(json, patchedState, path, { type: 'value', enforceString })
        };
      });
    }
    function acceptAutoRepair() {
      if (textIsRepaired && json !== void 0) {
        handleReplaceJson(json);
      }
      return json !== void 0 ? { json } : { text: text || '' };
    }
    async function handleCut(indent = true) {
      await onCut({
        json,
        selection,
        indentation: indent ? indentation : void 0,
        readOnly,
        parser,
        onPatch: handlePatch
      });
    }
    async function handleCopy(indent = true) {
      if (json === void 0) {
        return;
      }
      await onCopy({
        json,
        selection,
        indentation: indent ? indentation : void 0,
        parser
      });
    }
    async function handlePasteFromMenu() {
      try {
        const clipboardText = await navigator.clipboard.readText();
        _paste(clipboardText);
      } catch (err) {
        console.error(err);
        copyPasteModalOpen = true;
      }
    }
    function _paste(clipboardText) {
      if (clipboardText === void 0) {
        return;
      }
      onPaste({
        clipboardText,
        json,
        selection,
        readOnly,
        parser,
        onPatch: handlePatch,
        onChangeText: handleChangeText,
        onPasteMultilineText: handlePasteMultilineText,
        openRepairModal
      });
    }
    function openRepairModal(text2, onApply) {
      jsonRepairModalProps = {
        text: text2,
        onParse: (text3) => parsePartialJson(text3, (t) => parseAndRepair(t, parser)),
        onRepair: repairPartialJson,
        onApply,
        onClose: focus
      };
    }
    function handleRemove() {
      onRemove({
        json,
        text,
        selection,
        keepSelection: false,
        readOnly,
        onChange,
        onPatch: handlePatch
      });
    }
    function handleDuplicate() {
      if (
        readOnly ||
        json === void 0 ||
        !selection ||
        !hasSelectionContents ||
        isEmpty(getFocusPath(selection))
      ) {
        return;
      }
      debug2('duplicate', { selection });
      const operations = duplicate(json, getSelectionPaths(json, selection));
      handlePatch(operations);
    }
    function handleExtract() {
      if (
        readOnly ||
        !selection ||
        (!isMultiSelection(selection) && !isValueSelection(selection)) ||
        isEmpty(getFocusPath(selection))
      ) {
        return;
      }
      debug2('extract', { selection });
      const operations = extract(json, selection);
      handlePatch(operations, (patchedJson, patchedState) => {
        if (isObjectOrArray(patchedJson)) {
          const path = [];
          return {
            state: expandSmartIfCollapsed(patchedJson, patchedState, path)
          };
        }
        return void 0;
      });
    }
    function handleInsert(insertType) {
      onInsert({
        insertType,
        selectInside: true,
        initialValue: void 0,
        json,
        selection,
        readOnly,
        parser,
        onPatch: handlePatch,
        onReplaceJson: handleReplaceJson
      });
    }
    function handleInsertFromContextMenu(type) {
      if (isKeySelection(selection)) {
        selection = createValueSelection(selection.path);
      }
      if (!selection) {
        selection = getInitialSelection(json, documentState);
      }
      handleInsert(type);
    }
    function handleConvert(type) {
      if (readOnly || !selection) {
        return;
      }
      if (!canConvert(selection)) {
        onError(new Error(`Cannot convert current selection to ${type}`));
        return;
      }
      try {
        const path = getAnchorPath(selection);
        const currentValue = getIn(json, path);
        const convertedValue = convertValue(currentValue, type, parser);
        if (convertedValue === currentValue) {
          return;
        }
        const operations = [
          {
            op: 'replace',
            path: compileJSONPointer(path),
            value: convertedValue
          }
        ];
        debug2('handleConvert', { selection, path, type, operations });
        handlePatch(operations, (patchedJson, patchedState) => {
          return {
            state: selection
              ? expandSmart(patchedJson, patchedState, getFocusPath(selection))
              : documentState
          };
        });
      } catch (err) {
        onError(err);
      }
    }
    function handleInsertBefore() {
      if (!selection) {
        return;
      }
      const selectionBefore = getSelectionUp(json, documentState, selection, false);
      const parentPath = initial(getFocusPath(selection));
      if (
        selectionBefore &&
        !isEmpty(getFocusPath(selectionBefore)) &&
        isEqual(parentPath, initial(getFocusPath(selectionBefore)))
      ) {
        selection = createAfterSelection(getFocusPath(selectionBefore));
      } else {
        selection = createInsideSelection(parentPath);
      }
      debug2('insert before', { selection, selectionBefore, parentPath });
      handleContextMenu();
    }
    function handleInsertAfter() {
      if (!selection) {
        return;
      }
      const path = getEndPath(json, selection);
      debug2('insert after', path);
      selection = createAfterSelection(path);
      handleContextMenu();
    }
    function handleUndo() {
      if (readOnly) {
        return;
      }
      if (!history.canUndo) {
        return;
      }
      const item = history.undo();
      if (!isTreeHistoryItem(item)) {
        onUndo(item);
        return;
      }
      const previousContent = { json, text };
      json = item.undo.patch ? immutableJSONPatch(json, item.undo.patch) : item.undo.json;
      documentState = item.undo.documentState;
      selection = item.undo.selection;
      text = item.undo.text;
      textIsRepaired = item.undo.textIsRepaired;
      parseError = void 0;
      debug2('undo', { item, json, documentState, selection });
      const patchResult =
        item.undo.patch && item.redo.patch
          ? {
              json,
              previousJson: previousContent.json,
              redo: item.undo.patch,
              undo: item.redo.patch
            }
          : void 0;
      emitOnChange(previousContent, patchResult);
      focus();
      if (selection) {
        scrollTo(getFocusPath(selection), { scrollToWhenVisible: false });
      }
    }
    function handleRedo() {
      if (readOnly) {
        return;
      }
      if (!history.canRedo) {
        return;
      }
      const item = history.redo();
      if (!isTreeHistoryItem(item)) {
        onRedo(item);
        return;
      }
      const previousContent = { json, text };
      json = item.redo.patch ? immutableJSONPatch(json, item.redo.patch) : item.redo.json;
      documentState = item.redo.documentState;
      selection = item.redo.selection;
      text = item.redo.text;
      textIsRepaired = item.redo.textIsRepaired;
      parseError = void 0;
      debug2('redo', { item, json, documentState, selection });
      const patchResult =
        item.undo.patch && item.redo.patch
          ? {
              json,
              previousJson: previousContent.json,
              redo: item.redo.patch,
              undo: item.undo.patch
            }
          : void 0;
      emitOnChange(previousContent, patchResult);
      focus();
      if (selection) {
        scrollTo(getFocusPath(selection), { scrollToWhenVisible: false });
      }
    }
    function openSortModal(rootPath) {
      if (readOnly || json === void 0) {
        return;
      }
      modalOpen = true;
      onSortModal({
        id: sortModalId,
        json,
        rootPath,
        onSort: async ({ operations }) => {
          debug2('onSort', rootPath, operations);
          handlePatch(operations, (patchedJson, patchedState) => ({
            // expand the newly replaced array if needed, and select it
            state: expandSmartIfCollapsed(patchedJson, patchedState, rootPath),
            selection: createValueSelection(rootPath)
          }));
        },
        onClose: () => {
          modalOpen = false;
          setTimeout(focus);
        }
      });
    }
    function handleSortSelection() {
      if (!selection) {
        return;
      }
      const rootPath = findRootPath(json, selection);
      openSortModal(rootPath);
    }
    function handleSortAll() {
      const rootPath = [];
      openSortModal(rootPath);
    }
    function openTransformModal(options) {
      if (json === void 0) {
        return;
      }
      const { id: id2, onTransform, onClose } = options;
      const rootPath = options.rootPath || [];
      modalOpen = true;
      onTransformModal({
        id: id2 || transformModalId,
        json,
        rootPath,
        onTransform: (operations) => {
          if (onTransform) {
            onTransform({
              operations,
              json,
              transformedJson: immutableJSONPatch(json, operations)
            });
          } else {
            debug2('onTransform', rootPath, operations);
            handlePatch(operations, (patchedJson, patchedState) => ({
              // expand the newly replaced array if needed and select it
              state: expandSmartIfCollapsed(patchedJson, patchedState, rootPath),
              selection: createValueSelection(rootPath)
            }));
          }
        },
        onClose: () => {
          modalOpen = false;
          setTimeout(focus);
          if (onClose) {
            onClose();
          }
        }
      });
    }
    function handleTransformSelection() {
      if (!selection) {
        return;
      }
      const rootPath = findRootPath(json, selection);
      openTransformModal({ rootPath });
    }
    function handleTransformAll() {
      openTransformModal({ rootPath: [] });
    }
    function openJSONEditorModal(path, value) {
      debug2('openJSONEditorModal', { path, value });
      modalOpen = true;
      onJSONEditorModal({
        content: { json: value },
        path,
        onPatch: context.onPatch,
        onClose: () => {
          modalOpen = false;
          setTimeout(focus);
        }
      });
    }
    async function scrollTo(path, { scrollToWhenVisible = true, element: element2 } = {}) {
      documentState = expandPath(json, documentState, path, expandNone);
      const elem = element2 ?? findElement();
      debug2('scrollTo', { path, elem, refContents });
      {
        return Promise.resolve();
      }
    }
    function findElement(path) {
      return void 0;
    }
    function findSearchResult(resultIndex) {
      return void 0;
    }
    function emitOnChange(previousContent, patchResult) {
      if (previousContent.json === void 0 && previousContent?.text === void 0) {
        return;
      }
      if (text !== void 0) {
        const content = { text, json: void 0 };
        onChange?.(content, previousContent, { contentErrors: validate(), patchResult });
      } else if (json !== void 0) {
        const content = { text: void 0, json };
        onChange?.(content, previousContent, { contentErrors: validate(), patchResult });
      }
    }
    function handlePatch(operations, afterPatch) {
      debug2('handlePatch', operations, afterPatch);
      const previousContent = { json, text };
      const patchResult = patch(operations, afterPatch);
      emitOnChange(previousContent, patchResult);
      return patchResult;
    }
    function handleReplaceJson(updatedJson, afterPatch) {
      const previousContent = { json, text };
      const previousState = { documentState, selection, json, text, textIsRepaired };
      const updatedState = expandPath(
        json,
        syncDocumentState(updatedJson, documentState),
        [],
        expandMinimal
      );
      const callback =
        typeof afterPatch === 'function'
          ? afterPatch(updatedJson, updatedState, selection)
          : void 0;
      json = callback?.json !== void 0 ? callback.json : updatedJson;
      documentState = callback?.state !== void 0 ? callback.state : updatedState;
      selection = callback?.selection !== void 0 ? callback.selection : selection;
      text = void 0;
      textIsRepaired = false;
      parseError = void 0;
      clearSelectionWhenNotExisting(json);
      addHistoryItem(previousState);
      const patchResult = void 0;
      emitOnChange(previousContent, patchResult);
    }
    function handleChangeText(updatedText, afterPatch) {
      debug2('handleChangeText');
      const previousContent = { json, text };
      const previousState = { documentState, selection, json, text, textIsRepaired };
      try {
        json = parseMemoizeOne(updatedText);
        documentState = expandPath(json, syncDocumentState(json, documentState), [], expandMinimal);
        text = void 0;
        textIsRepaired = false;
        parseError = void 0;
      } catch (err) {
        try {
          json = parseMemoizeOne(jsonrepair(updatedText));
          documentState = expandPath(
            json,
            syncDocumentState(json, documentState),
            [],
            expandMinimal
          );
          text = updatedText;
          textIsRepaired = true;
          parseError = void 0;
        } catch {
          json = void 0;
          documentState = createDocumentState({ json, expand: expandMinimal });
          text = updatedText;
          textIsRepaired = false;
          parseError =
            text !== '' ? normalizeJsonParseError(text, err.message || String(err)) : void 0;
        }
      }
      if (typeof afterPatch === 'function') {
        const callback = afterPatch(json, documentState, selection);
        json = callback?.json !== void 0 ? callback.json : json;
        documentState = callback?.state !== void 0 ? callback.state : documentState;
        selection = callback?.selection !== void 0 ? callback.selection : selection;
      }
      clearSelectionWhenNotExisting(json);
      addHistoryItem(previousState);
      const patchResult = void 0;
      emitOnChange(previousContent, patchResult);
    }
    function handleExpand(path, expanded, recursive = false) {
      debug2('handleExpand', { path, expanded, recursive });
      if (expanded) {
        expand(path, recursive ? expandAll : expandSelf);
      } else {
        collapse(path, recursive);
      }
      focus();
    }
    function handleExpandAll() {
      handleExpand([], true, true);
    }
    function handleCollapseAll() {
      handleExpand([], false, true);
    }
    function openFind(findAndReplace) {
      debug2('openFind', { findAndReplace });
      showSearch = false;
      showReplace = false;
      showSearch = true;
      showReplace = findAndReplace;
    }
    function handleExpandSection(path, section) {
      debug2('handleExpandSection', path, section);
      documentState = expandSection(json, documentState, path, section);
    }
    function handlePasteJson(newPastedJson) {
      debug2('pasted json as text', newPastedJson);
      pastedJson = newPastedJson;
    }
    function handlePasteMultilineText(pastedText) {
      debug2('pasted multiline text', { pastedText });
      pastedMultilineText = pastedText;
    }
    function openContextMenu({ anchor, left, top, width, height, offsetTop, offsetLeft, showTip }) {
      const defaultItems = createTreeContextMenuItems({
        json,
        documentState,
        selection,
        readOnly,
        onEditKey: handleEditKey,
        onEditValue: handleEditValue,
        onToggleEnforceString: handleToggleEnforceString,
        onCut: handleCut,
        onCopy: handleCopy,
        onPaste: handlePasteFromMenu,
        onRemove: handleRemove,
        onDuplicate: handleDuplicate,
        onExtract: handleExtract,
        onInsertBefore: handleInsertBefore,
        onInsert: handleInsertFromContextMenu,
        onInsertAfter: handleInsertAfter,
        onConvert: handleConvert,
        onSort: handleSortSelection,
        onTransform: handleTransformSelection
      });
      const items = onRenderContextMenu(defaultItems) ?? defaultItems;
      if (items === false) {
        return;
      }
      const props = {
        tip: showTip
          ? 'Tip: you can open this context menu via right-click or with Ctrl+Q'
          : void 0,
        items,
        onRequestClose: () => closeAbsolutePopup(popupId)
      };
      const options = {
        left,
        top,
        offsetTop,
        offsetLeft,
        width,
        height,
        anchor,
        closeOnOuterClick: true,
        onClose: () => {
          modalOpen = false;
          focus();
        }
      };
      modalOpen = true;
      const popupId = openAbsolutePopup(ContextMenu, props, options);
    }
    function handleContextMenu(event) {
      if (isEditingSelection(selection)) {
        return;
      }
    }
    function handleContextMenuFromTreeMenu(event) {
      openContextMenu({
        anchor: findParentWithNodeName(event.target, 'BUTTON'),
        offsetTop: 0,
        width: CONTEXT_MENU_WIDTH,
        height: CONTEXT_MENU_HEIGHT,
        showTip: true
      });
    }
    async function handleParsePastedJson() {
      debug2('apply pasted json', pastedJson);
      if (!pastedJson) {
        return;
      }
      const { onPasteAsJson } = pastedJson;
      pastedJson = void 0;
      onPasteAsJson();
      setTimeout(focus);
    }
    async function handleParsePastedMultilineText() {
      debug2('apply pasted multiline text', pastedMultilineText);
      if (!pastedMultilineText) {
        return;
      }
      _paste(JSON.stringify(pastedMultilineText));
      setTimeout(focus);
    }
    function handleClearPastedJson() {
      debug2('clear pasted json');
      pastedJson = void 0;
      focus();
    }
    function handleClearPastedMultilineText() {
      debug2('clear pasted multiline text');
      pastedMultilineText = void 0;
      focus();
    }
    function handleRequestRepair() {
      onChangeMode(Mode.text);
    }
    function handleNavigationBarSelect(newSelection) {
      selection = newSelection;
      focus();
      scrollTo(getFocusPath(newSelection));
    }
    function focus() {
      debug2('focus');
    }
    function findNextInside(path) {
      return getSelectionNextInside(json, documentState, path);
    }
    function handleDrag(event) {
      if (autoScrollHandler) {
        autoScrollHandler.onDrag(event);
      }
    }
    function handleDragEnd() {
      if (autoScrollHandler) {
        autoScrollHandler.onDragEnd();
      }
    }
    let context;
    emitOnSelect(selection);
    normalization = createNormalizationFunctions({
      escapeControlCharacters,
      escapeUnicodeCharacters
    });
    applyExternalContent(externalContent);
    applyExternalSelection(externalSelection);
    updateValidationErrors(json, validator, parser, validationParser);
    autoScrollHandler = void 0;
    context = {
      mode: Mode.tree,
      readOnly,
      truncateTextSize,
      parser,
      normalization,
      getJson,
      getDocumentState,
      getSelection,
      findElement,
      findNextInside,
      focus,
      onPatch: handlePatch,
      onInsert: handleInsert,
      onExpand: handleExpand,
      onSelect: handleSelect,
      onFind: openFind,
      onExpandSection: handleExpandSection,
      onPasteJson: handlePasteJson,
      onRenderValue,
      onContextMenu: openContextMenu,
      onClassName: onClassName || (() => void 0),
      onDrag: handleDrag,
      onDragEnd: handleDragEnd
    };
    debug2('context changed', context);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(
        `<div role="tree" tabindex="-1"${attr_class('jse-tree-mode svelte-8301w6', void 0, { 'no-main-menu': !mainMenuBar })}>`
      );
      if (mainMenuBar) {
        $$renderer3.push('<!--[-->');
        TreeMenu($$renderer3, {
          json,
          selection,
          readOnly,
          history,
          onExpandAll: handleExpandAll,
          onCollapseAll: handleCollapseAll,
          onUndo: handleUndo,
          onRedo: handleRedo,
          onSort: handleSortAll,
          onTransform: handleTransformAll,
          onContextMenu: handleContextMenuFromTreeMenu,
          onCopy: handleCopy,
          onRenderMenu,
          get showSearch() {
            return showSearch;
          },
          set showSearch($$value) {
            showSearch = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push('<!--[!-->');
      }
      $$renderer3.push(`<!--]--> `);
      if (navigationBar) {
        $$renderer3.push('<!--[-->');
        NavigationBar($$renderer3, {
          json,
          selection,
          onSelect: handleNavigationBarSelect,
          onError,
          pathParser
        });
      } else {
        $$renderer3.push('<!--[!-->');
      }
      $$renderer3.push(`<!--]--> `);
      if (!isSSR) {
        $$renderer3.push('<!--[-->');
        $$renderer3.push(
          `<label class="jse-hidden-input-label svelte-8301w6"><input type="text"${attr('readonly', true, true)} tabindex="-1" class="jse-hidden-input svelte-8301w6"/></label> `
        );
        if (json === void 0) {
          $$renderer3.push('<!--[-->');
          if (text === '' || text === void 0) {
            $$renderer3.push('<!--[-->');
            Welcome($$renderer3, {
              readOnly
            });
          } else {
            $$renderer3.push('<!--[!-->');
            Message($$renderer3, {
              type: 'error',
              message:
                'The loaded JSON document is invalid and could not be repaired automatically.',
              actions: !readOnly
                ? [
                    {
                      icon: faCode,
                      text: 'Repair manually',
                      title: 'Open the document in "code" mode and repair it manually',
                      onClick: handleRequestRepair
                    }
                  ]
                : []
            });
            $$renderer3.push(`<!----> `);
            JSONPreview($$renderer3, { text, json, indentation, parser });
            $$renderer3.push(`<!---->`);
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push('<!--[!-->');
          $$renderer3.push(`<div class="jse-search-box-container svelte-8301w6">`);
          SearchBox($$renderer3, {
            json,
            documentState,
            parser,
            showSearch,
            showReplace,
            readOnly,
            columns: void 0,
            onSearch: handleSearch,
            onFocus: handleFocusSearch,
            onPatch: handlePatch,
            onClose: handleCloseSearch
          });
          $$renderer3.push(
            `<!----></div> <div class="jse-contents svelte-8301w6"${attr('data-jsoneditor-scrollable-contents', true)}>`
          );
          if (showSearch) {
            $$renderer3.push('<!--[-->');
            $$renderer3.push(`<div class="jse-search-box-background svelte-8301w6"></div>`);
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> `);
          JSONNode($$renderer3, {
            value: json,
            pointer: '',
            state: documentState,
            validationErrors,
            searchResults,
            selection,
            context,
            onDragSelectionStart: noop$3
          });
          $$renderer3.push(`<!----></div> `);
          if (pastedJson) {
            $$renderer3.push('<!--[-->');
            Message($$renderer3, {
              type: 'info',
              message: `You pasted a JSON ${Array.isArray(pastedJson.contents) ? 'array' : 'object'} as text`,
              actions: [
                {
                  icon: faWrench,
                  text: 'Paste as JSON instead',
                  title: 'Replace the value with the pasted JSON',
                  onMouseDown: handleParsePastedJson
                },
                {
                  text: 'Leave as is',
                  title: 'Keep the JSON embedded in the value',
                  onClick: handleClearPastedJson
                }
              ]
            });
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> `);
          if (pastedMultilineText) {
            $$renderer3.push('<!--[-->');
            Message($$renderer3, {
              type: 'info',
              message: 'Multiline text was pasted as array',
              actions: [
                {
                  icon: faWrench,
                  text: 'Paste as string instead',
                  title: 'Paste the clipboard data as a single string value instead of an array',
                  onClick: handleParsePastedMultilineText
                },
                {
                  text: 'Leave as is',
                  title: 'Keep the pasted array',
                  onClick: handleClearPastedMultilineText
                }
              ]
            });
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> `);
          if (textIsRepaired) {
            $$renderer3.push('<!--[-->');
            Message($$renderer3, {
              type: 'success',
              message: 'The loaded JSON document was invalid but is successfully repaired.',
              actions: !readOnly
                ? [
                    {
                      icon: faCheck,
                      text: 'Ok',
                      title: 'Accept the repaired document',
                      onClick: acceptAutoRepair
                    },
                    {
                      icon: faCode,
                      text: 'Repair manually instead',
                      title: 'Leave the document unchanged and repair it manually instead',
                      onClick: handleRequestRepair
                    }
                  ]
                : [],
              onClose: focus
            });
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> `);
          ValidationErrorsOverview($$renderer3, {
            validationErrors: validationErrorList,
            selectError: handleSelectValidationError
          });
          $$renderer3.push(`<!---->`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push('<!--[!-->');
        $$renderer3.push(
          `<div class="jse-contents svelte-8301w6"><div class="jse-loading-space svelte-8301w6"></div> <div class="jse-loading svelte-8301w6">loading...</div></div>`
        );
      }
      $$renderer3.push(`<!--]--></div> `);
      if (copyPasteModalOpen) {
        $$renderer3.push('<!--[-->');
        CopyPasteModal($$renderer3, { onClose: () => (copyPasteModalOpen = false) });
      } else {
        $$renderer3.push('<!--[!-->');
      }
      $$renderer3.push(`<!--]--> `);
      if (jsonRepairModalProps) {
        $$renderer3.push('<!--[-->');
        JSONRepairModal(
          $$renderer3,
          spread_props([
            jsonRepairModalProps,
            {
              onClose: () => {
                jsonRepairModalProps?.onClose();
                jsonRepairModalProps = void 0;
              }
            }
          ])
        );
      } else {
        $$renderer3.push('<!--[!-->');
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      readOnly,
      externalContent,
      externalSelection,
      history,
      truncateTextSize,
      mainMenuBar,
      navigationBar,
      escapeControlCharacters,
      escapeUnicodeCharacters,
      parser,
      parseMemoizeOne,
      validator,
      validationParser,
      pathParser,
      indentation,
      onError,
      onChange,
      onChangeMode,
      onSelect,
      onUndo,
      onRedo,
      onRenderValue,
      onRenderMenu,
      onRenderContextMenu,
      onClassName,
      onFocus,
      onBlur,
      onSortModal,
      onTransformModal,
      onJSONEditorModal,
      expand,
      collapse,
      validate,
      getJson,
      patch,
      acceptAutoRepair,
      openTransformModal,
      scrollTo,
      findElement,
      findSearchResult,
      focus
    });
  });
}
function readonlyProxy(target) {
  if (!isObject(target)) {
    return target;
  }
  return new Proxy(target, {
    get(target2, property, receiver) {
      const value = Reflect.get(target2, property, receiver);
      return readonlyProxy(value);
    },
    set() {
      return false;
    },
    deleteProperty() {
      return false;
    }
  });
}
function isObject(value) {
  return typeof value === 'object' && value !== null;
}
const MAX_HISTORY_ITEMS = 1e3;
const debug = createDebug('jsoneditor:History');
function createHistoryInstance(options = {}) {
  const maxItems = options.maxItems || MAX_HISTORY_ITEMS;
  let reverseItems = [];
  let index = 0;
  function canUndo() {
    return index < reverseItems.length;
  }
  function canRedo() {
    return index > 0;
  }
  function get() {
    return {
      canUndo: canUndo(),
      canRedo: canRedo(),
      items: () => reverseItems.slice().reverse(),
      add,
      undo,
      redo,
      clear
    };
  }
  function handleChange() {
    if (options.onChange) {
      options.onChange(get());
    }
  }
  function add(item) {
    debug('add', item);
    reverseItems = [item].concat(reverseItems.slice(index)).slice(0, maxItems);
    index = 0;
    handleChange();
  }
  function clear() {
    debug('clear');
    reverseItems = [];
    index = 0;
    handleChange();
  }
  function undo() {
    if (canUndo()) {
      const item = reverseItems[index];
      index += 1;
      debug('undo', item);
      handleChange();
      return item;
    }
    return void 0;
  }
  function redo() {
    if (canRedo()) {
      index -= 1;
      debug('redo', reverseItems[index]);
      handleChange();
      return reverseItems[index];
    }
    return void 0;
  }
  return {
    get
  };
}
function TransformModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const debug2 = createDebug('jsoneditor:TransformModal');
    let id2 = fallback($$props['id'], () => 'transform-modal-' + uniqueId(), true);
    let json = $$props['json'];
    let rootPath = fallback($$props['rootPath'], () => [], true);
    let indentation = $$props['indentation'];
    let truncateTextSize = $$props['truncateTextSize'];
    let escapeControlCharacters = $$props['escapeControlCharacters'];
    let escapeUnicodeCharacters = $$props['escapeUnicodeCharacters'];
    let parser = $$props['parser'];
    let parseMemoizeOne = $$props['parseMemoizeOne'];
    let validationParser = $$props['validationParser'];
    let pathParser = $$props['pathParser'];
    let queryLanguages = $$props['queryLanguages'];
    let queryLanguageId = $$props['queryLanguageId'];
    let onChangeQueryLanguage = $$props['onChangeQueryLanguage'];
    let onRenderValue = $$props['onRenderValue'];
    let onRenderMenu = $$props['onRenderMenu'];
    let onRenderContextMenu = $$props['onRenderContextMenu'];
    let onClassName = $$props['onClassName'];
    let onTransform = $$props['onTransform'];
    let onClose = $$props['onClose'];
    const historyInstance = createHistoryInstance({
      onChange: (updatedHistory) => (history = updatedHistory)
    });
    let history = historyInstance.get();
    let selectedJson;
    let selectedContent;
    let fullscreen = false;
    const stateId = `${id2}:${compileJSONPointer(rootPath)}`;
    const state = transformModalStates[stateId] ?? {};
    let queryOptions = state.queryOptions ?? {};
    let query = queryLanguageId === state.queryLanguageId && state.query ? state.query : '';
    let isManual = state.isManual ?? false;
    let queryError = void 0;
    let previewError = void 0;
    let previewContent = { text: '' };
    if (!isManual) {
      updateQueryByWizard(queryOptions);
    }
    function getSelectedQueryLanguage(queryLanguageId2) {
      return queryLanguages.find((item) => item.id === queryLanguageId2) ?? queryLanguages[0];
    }
    function updateQueryByWizard(newQueryOptions) {
      try {
        queryOptions = newQueryOptions;
        query = getSelectedQueryLanguage(queryLanguageId).createQuery(
          selectedJson,
          newQueryOptions
        );
        queryError = void 0;
        isManual = false;
        debug2('updateQueryByWizard', { queryOptions, query, isManual });
      } catch (err) {
        queryError = String(err);
      }
    }
    function previewTransform(previewJson, query2) {
      if (previewJson === void 0) {
        previewContent = { text: '' };
        previewError = 'Error: No JSON';
        return;
      }
      if (query2.trim() === '') {
        previewContent = { json: previewJson };
        return;
      }
      try {
        debug2('previewTransform', { query: query2 });
        const jsonTransformed = getSelectedQueryLanguage(queryLanguageId).executeQuery(
          previewJson,
          query2,
          parser
        );
        previewContent = { json: jsonTransformed };
        previewError = void 0;
      } catch (err) {
        previewContent = { text: '' };
        previewError = String(err);
      }
    }
    const previewTransformDebounced = debounce(previewTransform, DEBOUNCE_DELAY);
    function handleChangeQueryLanguage(newQueryLanguageId) {
      debug2('handleChangeQueryLanguage', newQueryLanguageId);
      queryLanguageId = newQueryLanguageId;
      onChangeQueryLanguage(newQueryLanguageId);
      updateQueryByWizard(queryOptions);
    }
    selectedJson = readonlyProxy(getIn(json, rootPath));
    selectedContent = selectedJson ? { json: selectedJson } : { text: '' };
    {
      previewTransformDebounced(selectedJson, query);
    }
    {
      transformModalStates[stateId] = { queryOptions, query, queryLanguageId, isManual };
      debug2('store state in memory', stateId, transformModalStates[stateId]);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Modal($$renderer3, {
        onClose,
        className: 'jse-transform-modal',
        fullscreen,
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="jse-transform-modal-inner svelte-co0e1w">`);
          AbsolutePopup($$renderer4, {
            children: ($$renderer5) => {
              TransformModalHeader($$renderer5, {
                queryLanguages,
                queryLanguageId,
                onChangeQueryLanguage: handleChangeQueryLanguage,
                onClose,
                get fullscreen() {
                  return fullscreen;
                },
                set fullscreen($$value) {
                  fullscreen = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(
                `<!----> <div class="jse-modal-contents svelte-co0e1w"><div class="jse-main-contents svelte-co0e1w"><div class="jse-query-contents svelte-co0e1w"><div class="jse-label svelte-co0e1w"><div class="jse-label-inner svelte-co0e1w">Language</div></div> <div class="jse-description svelte-co0e1w">${html(getSelectedQueryLanguage(queryLanguageId).description)}</div> <div class="jse-label svelte-co0e1w"><div class="jse-label-inner svelte-co0e1w">Path</div></div> <input class="jse-path svelte-co0e1w" type="text" readonly title="Selected path"${attr('value', !isEmpty(rootPath) ? stringifyJSONPath(rootPath) : '(document root)')}/> <div class="jse-label svelte-co0e1w"><div class="jse-label-inner svelte-co0e1w"><button type="button" class="svelte-co0e1w">`
              );
              Icon($$renderer5, { data: faCaretDown });
              $$renderer5.push(`<!----> Wizard</button></div></div> `);
              {
                $$renderer5.push('<!--[-->');
                if (Array.isArray(selectedJson)) {
                  $$renderer5.push('<!--[-->');
                  TransformWizard($$renderer5, {
                    queryOptions,
                    json: selectedJson,
                    onChange: updateQueryByWizard
                  });
                  $$renderer5.push(`<!----> `);
                  if (queryError) {
                    $$renderer5.push('<!--[-->');
                    $$renderer5.push(
                      `<div class="query-error svelte-co0e1w">${escape_html(queryError)}</div>`
                    );
                  } else {
                    $$renderer5.push('<!--[!-->');
                  }
                  $$renderer5.push(`<!--]-->`);
                } else {
                  $$renderer5.push('<!--[!-->');
                  $$renderer5.push(`(Only available for arrays, not for objects)`);
                }
                $$renderer5.push(`<!--]-->`);
              }
              $$renderer5.push(
                `<!--]--> <div class="jse-label svelte-co0e1w"><div class="jse-label-inner svelte-co0e1w">Query</div></div> <textarea class="jse-query svelte-co0e1w" spellcheck="false">`
              );
              const $$body = escape_html(query);
              if ($$body) {
                $$renderer5.push(`${$$body}`);
              }
              $$renderer5.push(
                `</textarea></div> <div${attr_class('jse-data-contents svelte-co0e1w', void 0, { 'jse-hide-original-data': false })}><div${attr_class('jse-original-data svelte-co0e1w', void 0, { 'jse-hide': false })}><div class="jse-label svelte-co0e1w"><div class="jse-label-inner svelte-co0e1w"><button type="button" class="svelte-co0e1w">`
              );
              Icon($$renderer5, { data: faCaretDown });
              $$renderer5.push(`<!----> Original</button></div></div> `);
              {
                $$renderer5.push('<!--[-->');
                TreeMode($$renderer5, {
                  externalContent: selectedContent,
                  externalSelection: void 0,
                  history,
                  readOnly: true,
                  truncateTextSize,
                  mainMenuBar: false,
                  navigationBar: false,
                  indentation,
                  escapeControlCharacters,
                  escapeUnicodeCharacters,
                  parser,
                  parseMemoizeOne,
                  onRenderValue,
                  onRenderMenu,
                  onRenderContextMenu,
                  onError: console.error,
                  onChange: noop$3,
                  onChangeMode: noop$3,
                  onSelect: noop$3,
                  onUndo: noop$3,
                  onRedo: noop$3,
                  onFocus: noop$3,
                  onBlur: noop$3,
                  onSortModal: noop$3,
                  onTransformModal: noop$3,
                  onJSONEditorModal: noop$3,
                  onClassName,
                  validator: void 0,
                  validationParser,
                  pathParser
                });
              }
              $$renderer5.push(
                `<!--]--></div> <div class="jse-preview-data svelte-co0e1w"><div class="jse-label svelte-co0e1w"><div class="jse-label-inner svelte-co0e1w">Preview</div></div> `
              );
              if (!previewError) {
                $$renderer5.push('<!--[-->');
                TreeMode($$renderer5, {
                  externalContent: previewContent,
                  externalSelection: void 0,
                  history,
                  readOnly: true,
                  truncateTextSize,
                  mainMenuBar: false,
                  navigationBar: false,
                  indentation,
                  escapeControlCharacters,
                  escapeUnicodeCharacters,
                  parser,
                  parseMemoizeOne,
                  onRenderValue,
                  onRenderMenu,
                  onRenderContextMenu,
                  onError: console.error,
                  onChange: noop$3,
                  onChangeMode: noop$3,
                  onSelect: noop$3,
                  onUndo: noop$3,
                  onRedo: noop$3,
                  onFocus: noop$3,
                  onBlur: noop$3,
                  onSortModal: noop$3,
                  onTransformModal: noop$3,
                  onJSONEditorModal: noop$3,
                  onClassName,
                  validator: void 0,
                  validationParser,
                  pathParser
                });
              } else {
                $$renderer5.push('<!--[!-->');
                $$renderer5.push(
                  `<div class="jse-preview jse-error svelte-co0e1w">${escape_html(previewError)}</div>`
                );
              }
              $$renderer5.push(
                `<!--]--></div></div></div> <div class="jse-actions svelte-co0e1w"><button type="button" class="jse-primary svelte-co0e1w"${attr('disabled', !!previewError, true)}>Transform</button></div></div>`
              );
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----></div>`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      id: id2,
      json,
      rootPath,
      indentation,
      truncateTextSize,
      escapeControlCharacters,
      escapeUnicodeCharacters,
      parser,
      parseMemoizeOne,
      validationParser,
      pathParser,
      queryLanguages,
      queryLanguageId,
      onChangeQueryLanguage,
      onRenderValue,
      onRenderMenu,
      onRenderContextMenu,
      onClassName,
      onTransform,
      onClose
    });
  });
}
function noop() {
  return void 0;
}
function TextMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let items;
    let readOnly = fallback($$props['readOnly'], false);
    let onExpandAll = $$props['onExpandAll'];
    let onCollapseAll = $$props['onCollapseAll'];
    let onFormat = $$props['onFormat'];
    let onCompact = $$props['onCompact'];
    let onSort = $$props['onSort'];
    let onTransform = $$props['onTransform'];
    let onToggleSearch = $$props['onToggleSearch'];
    let onUndo = $$props['onUndo'];
    let onRedo = $$props['onRedo'];
    let canExpandAll = $$props['canExpandAll'];
    let canCollapseAll = $$props['canCollapseAll'];
    let canUndo = $$props['canUndo'];
    let canRedo = $$props['canRedo'];
    let canFormat = $$props['canFormat'];
    let canCompact = $$props['canCompact'];
    let canSort = $$props['canSort'];
    let canTransform = $$props['canTransform'];
    let onRenderMenu = $$props['onRenderMenu'];
    let expandMenuItem;
    let collapseMenuItem;
    const searchItem = {
      type: 'button',
      icon: faSearch,
      title: 'Search (Ctrl+F)',
      className: 'jse-search',
      onClick: onToggleSearch
    };
    let defaultItems;
    expandMenuItem = {
      type: 'button',
      icon: faJSONEditorExpand,
      title: 'Expand all',
      className: 'jse-expand-all',
      onClick: onExpandAll,
      disabled: !canExpandAll
    };
    collapseMenuItem = {
      type: 'button',
      icon: faJSONEditorCollapse,
      title: 'Collapse all',
      className: 'jse-collapse-all',
      onClick: onCollapseAll,
      disabled: !canCollapseAll
    };
    defaultItems = !readOnly
      ? [
          expandMenuItem,
          collapseMenuItem,
          { type: 'separator' },
          {
            type: 'button',
            icon: faJSONEditorFormat,
            title: 'Format JSON: add proper indentation and new lines (Ctrl+I)',
            className: 'jse-format',
            onClick: onFormat,
            disabled: readOnly || !canFormat
          },
          {
            type: 'button',
            icon: faJSONEditorCompact,
            title: 'Compact JSON: remove all white spacing and new lines (Ctrl+Shift+I)',
            className: 'jse-compact',
            onClick: onCompact,
            disabled: readOnly || !canCompact
          },
          { type: 'separator' },
          {
            type: 'button',
            icon: faSortAmountDownAlt,
            title: 'Sort',
            className: 'jse-sort',
            onClick: onSort,
            disabled: readOnly || !canSort
          },
          {
            type: 'button',
            icon: faFilter,
            title: 'Transform contents (filter, sort, project)',
            className: 'jse-transform',
            onClick: onTransform,
            disabled: readOnly || !canTransform
          },
          searchItem,
          { type: 'separator' },
          {
            type: 'button',
            icon: faUndo,
            title: 'Undo (Ctrl+Z)',
            className: 'jse-undo',
            onClick: onUndo,
            disabled: !canUndo
          },
          {
            type: 'button',
            icon: faRedo,
            title: 'Redo (Ctrl+Shift+Z)',
            className: 'jse-redo',
            onClick: onRedo,
            disabled: !canRedo
          },
          { type: 'space' }
        ]
      : [expandMenuItem, collapseMenuItem, { type: 'separator' }, searchItem, { type: 'space' }];
    items = onRenderMenu(defaultItems) || defaultItems;
    Menu($$renderer2, { items });
    bind_props($$props, {
      readOnly,
      onExpandAll,
      onCollapseAll,
      onFormat,
      onCompact,
      onSort,
      onTransform,
      onToggleSearch,
      onUndo,
      onRedo,
      canExpandAll,
      canCollapseAll,
      canUndo,
      canRedo,
      canFormat,
      canCompact,
      canSort,
      canTransform,
      onRenderMenu
    });
  });
}
function StatusBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let editorState = $$props['editorState'];
    let pos;
    let line;
    let lineNumber;
    let columnNumber;
    let charCount;
    pos = editorState?.selection?.main?.head;
    line = pos !== void 0 ? editorState?.doc?.lineAt(pos) : void 0;
    lineNumber = line !== void 0 ? line.number : void 0;
    columnNumber = line !== void 0 && pos !== void 0 ? pos - line.from + 1 : void 0;
    charCount = editorState?.selection?.ranges?.reduce((count, range2) => {
      return count + range2.to - range2.from;
    }, 0);
    $$renderer2.push(`<div class="jse-status-bar svelte-elhb0f">`);
    if (lineNumber !== void 0) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div class="jse-status-bar-info svelte-elhb0f">Line: ${escape_html(lineNumber)}</div>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> `);
    if (columnNumber !== void 0) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div class="jse-status-bar-info svelte-elhb0f">Column: ${escape_html(columnNumber)}</div>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> `);
    if (charCount !== void 0 && charCount > 0) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div class="jse-status-bar-info svelte-elhb0f">Selection: ${escape_html(charCount)} characters</div>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { editorState });
  });
}
function TextMode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let normalization, repairActions;
    let readOnly = $$props['readOnly'];
    let mainMenuBar = $$props['mainMenuBar'];
    let statusBar = $$props['statusBar'];
    let askToFormat = $$props['askToFormat'];
    let externalContent = $$props['externalContent'];
    let externalSelection = $$props['externalSelection'];
    let history = $$props['history'];
    let indentation = $$props['indentation'];
    let tabSize = $$props['tabSize'];
    let escapeUnicodeCharacters = $$props['escapeUnicodeCharacters'];
    let parser = $$props['parser'];
    let validator = $$props['validator'];
    let validationParser = $$props['validationParser'];
    let onChange = $$props['onChange'];
    let onChangeMode = $$props['onChangeMode'];
    let onSelect = $$props['onSelect'];
    let onUndo = $$props['onUndo'];
    let onRedo = $$props['onRedo'];
    let onError = $$props['onError'];
    let onFocus = $$props['onFocus'];
    let onBlur = $$props['onBlur'];
    let onRenderMenu = $$props['onRenderMenu'];
    let onSortModal = $$props['onSortModal'];
    let onTransformModal = $$props['onTransformModal'];
    const debug2 = createDebug('jsoneditor:TextMode');
    const isSSR = typeof window === 'undefined';
    debug2('isSSR:', isSSR);
    let domTextMode;
    let codeMirrorView;
    let editorState;
    let acceptTooLarge = false;
    let askToFormatApplied = askToFormat;
    let validationErrors = [];
    new Compartment();
    new Compartment();
    new Compartment();
    new Compartment();
    new Compartment();
    let content = externalContent;
    let text = getText(content, indentation, parser);
    let historyAnnotation = Annotation.define();
    let previousEscapeUnicodeCharacters = escapeUnicodeCharacters;
    onDestroy(() => {
      flush();
    });
    const sortModalId = uniqueId$1();
    const transformModalId = uniqueId$1();
    function focus() {}
    function collapse(path, recursive) {
      {
        return;
      }
    }
    function expand(path, callback = expandSelf) {
      {
        return;
      }
    }
    function handleExpandAll() {}
    function handleCollapseAll() {}
    let modalOpen = false;
    createFocusTracker({
      onMount: noop$2,
      onDestroy,
      getWindow: () => getWindow(domTextMode),
      hasFocus: () => (modalOpen && document.hasFocus()) || activeElementIsChildOf(domTextMode),
      onFocus,
      onBlur: () => {
        flush();
        onBlur();
      }
    });
    function patch(operations) {
      return handlePatch(operations, false);
    }
    function handlePatch(operations, emitChange) {
      debug2('handlePatch', operations, emitChange);
      const previousJson = parser.parse(text);
      const updatedJson = immutableJSONPatch(previousJson, operations);
      const undo = revertJSONPatch(previousJson, operations);
      const updatedContent = { text: parser.stringify(updatedJson, null, indentation) };
      setCodeMirrorContent(updatedContent, emitChange, false);
      return { json: updatedJson, previousJson, undo, redo: operations };
    }
    function handleFormat() {
      debug2('format');
      if (readOnly) {
        return false;
      }
      try {
        const updatedJson = parser.parse(text);
        const updatedContent = { text: parser.stringify(updatedJson, null, indentation) };
        setCodeMirrorContent(updatedContent, true, false);
        askToFormatApplied = askToFormat;
        return true;
      } catch (err) {
        onError(err);
      }
      return false;
    }
    function handleCompact() {
      debug2('compact');
      if (readOnly) {
        return false;
      }
      try {
        const updatedJson = parser.parse(text);
        const updatedContent = { text: parser.stringify(updatedJson) };
        setCodeMirrorContent(updatedContent, true, false);
        askToFormatApplied = false;
        return true;
      } catch (err) {
        onError(err);
      }
      return false;
    }
    function handleRepair() {
      debug2('repair');
      if (readOnly) {
        return;
      }
      try {
        const updatedContent = { text: jsonrepair(text) };
        setCodeMirrorContent(updatedContent, true, false);
        jsonStatus = JSON_STATUS_VALID;
        jsonParseError = void 0;
      } catch (err) {
        onError(err);
      }
    }
    function handleSort() {
      if (readOnly) {
        return;
      }
      try {
        const json = parser.parse(text);
        modalOpen = true;
        onSortModal({
          id: sortModalId,
          json,
          rootPath: [],
          onSort: async ({ operations }) => {
            debug2('onSort', operations);
            handlePatch(operations, true);
          },
          onClose: () => {
            modalOpen = false;
            focus();
          }
        });
      } catch (err) {
        onError(err);
      }
    }
    function openTransformModal({ id: id2, rootPath, onTransform, onClose }) {
      try {
        const json = parser.parse(text);
        modalOpen = true;
        onTransformModal({
          id: id2 || transformModalId,
          json,
          rootPath: rootPath || [],
          onTransform: (operations) => {
            if (onTransform) {
              onTransform({
                operations,
                json,
                transformedJson: immutableJSONPatch(json, operations)
              });
            } else {
              debug2('onTransform', operations);
              handlePatch(operations, true);
            }
          },
          onClose: () => {
            modalOpen = false;
            focus();
            if (onClose) {
              onClose();
            }
          }
        });
      } catch (err) {
        onError(err);
      }
    }
    function handleTransform() {
      if (readOnly) {
        return;
      }
      openTransformModal({ rootPath: [] });
    }
    function handleToggleSearch() {}
    function handleUndo() {
      if (readOnly) {
        return false;
      }
      flush();
      const item = history.undo();
      debug2('undo', item);
      if (!isTextHistoryItem(item)) {
        onUndo(item);
        return false;
      }
      codeMirrorView.dispatch({
        annotations: historyAnnotation.of('undo'),
        changes: ChangeSet.fromJSON(item.undo.changes),
        selection: EditorSelection.fromJSON(item.undo.selection),
        scrollIntoView: true
      });
      return true;
    }
    function handleRedo() {
      if (readOnly) {
        return false;
      }
      flush();
      const item = history.redo();
      debug2('redo', item);
      if (!isTextHistoryItem(item)) {
        onRedo(item);
        return false;
      }
      codeMirrorView.dispatch({
        annotations: historyAnnotation.of('redo'),
        changes: ChangeSet.fromJSON(item.redo.changes),
        selection: EditorSelection.fromJSON(item.redo.selection),
        scrollIntoView: true
      });
      return true;
    }
    function handleAcceptTooLarge() {
      acceptTooLarge = true;
      setCodeMirrorContent(externalContent, true, true);
    }
    function handleSwitchToTreeMode() {
      onChangeMode(Mode.tree);
    }
    function cancelLoadTooLarge() {}
    function handleSelectValidationError(validationError) {
      debug2('select validation error', validationError);
      const { from, to } = toRichValidationError(validationError);
      if (from === void 0 || to === void 0) {
        return;
      }
      setSelection(from, to);
    }
    function handleSelectParseError(parseError) {
      debug2('select parse error', parseError);
      const richParseError = toRichParseError(parseError);
      const from = richParseError.from != null ? richParseError.from : 0;
      const to = richParseError.to != null ? richParseError.to : 0;
      setSelection(from, to);
    }
    function setSelection(anchor, head) {
      debug2('setSelection', { anchor, head });
    }
    function toRichValidationError(validationError) {
      const { path, message, severity } = validationError;
      const { line, column, from, to } = findTextLocation(normalization.escapeValue(text), path);
      return { path, line, column, from, to, message, severity, actions: [] };
    }
    function toRichParseError(parseError, isRepairable) {
      const { line, column, position, message } = parseError;
      return {
        path: [],
        line,
        column,
        from: position,
        to: position,
        severity: ValidationSeverity.error,
        message,
        actions: void 0
      };
    }
    function setCodeMirrorContent(newContent, emitChange, forceUpdate) {
      getText(newContent, indentation, parser);
      const isChanged = !isEqual(newContent, content);
      debug2('setCodeMirrorContent', { isChanged, emitChange, forceUpdate });
      {
        return;
      }
    }
    function applyExternalSelection(externalSelection2) {
      if (!isTextSelection(externalSelection2)) {
        return;
      }
      fromTextSelection(externalSelection2);
    }
    function fromTextSelection(selection) {
      return isTextSelection(selection) ? EditorSelection.fromJSON(selection) : void 0;
    }
    async function refresh() {
      debug2('refresh');
      await updateTheme();
    }
    function forceUpdateText() {
      debug2('forceUpdateText', { escapeUnicodeCharacters });
    }
    function onChangeCodeMirrorValue() {
      {
        return;
      }
    }
    function updateLinter(validator2) {
      debug2('updateLinter', validator2);
      {
        return;
      }
    }
    async function updateTheme() {
      return Promise.resolve();
    }
    const onChangeCodeMirrorValueDebounced = debounce(
      onChangeCodeMirrorValue,
      TEXT_MODE_ONCHANGE_DELAY
    );
    function flush() {
      onChangeCodeMirrorValueDebounced.flush();
    }
    function disableTextEditor(text2, acceptTooLarge2) {
      const tooLarge = text2 ? text2.length > MAX_DOCUMENT_SIZE_TEXT_MODE : false;
      return tooLarge && !acceptTooLarge2;
    }
    let jsonStatus = JSON_STATUS_VALID;
    let jsonParseError;
    function validate() {
      debug2('validate:start');
      flush();
      const contentErrors = memoizedValidateText(
        normalization.escapeValue(text),
        validator,
        parser,
        validationParser
      );
      if (isContentParseError(contentErrors)) {
        jsonStatus = contentErrors.isRepairable ? JSON_STATUS_REPAIRABLE : JSON_STATUS_INVALID;
        jsonParseError = contentErrors.parseError;
        validationErrors = [];
      } else {
        jsonStatus = JSON_STATUS_VALID;
        jsonParseError = void 0;
        validationErrors = contentErrors?.validationErrors || [];
      }
      debug2('validate:end');
      return contentErrors;
    }
    const memoizedValidateText = memoizeOne(validateText);
    function handleShowMe() {
      if (jsonParseError) {
        handleSelectParseError(jsonParseError);
      }
    }
    const repairActionShowMe = {
      icon: faEye,
      text: 'Show me',
      title: 'Move to the parse error location',
      onClick: handleShowMe
    };
    normalization = createNormalizationFunctions({
      escapeControlCharacters: false,
      escapeUnicodeCharacters
    });
    setCodeMirrorContent(externalContent, false, false);
    applyExternalSelection(externalSelection);
    updateLinter(validator);
    {
      if (previousEscapeUnicodeCharacters !== escapeUnicodeCharacters) {
        previousEscapeUnicodeCharacters = escapeUnicodeCharacters;
        forceUpdateText();
      }
    }
    repairActions =
      jsonStatus === JSON_STATUS_REPAIRABLE && !readOnly
        ? [
            {
              icon: faWrench,
              text: 'Auto repair',
              title: 'Automatically repair JSON',
              onClick: handleRepair
            },
            repairActionShowMe
          ]
        : [repairActionShowMe];
    $$renderer2.push(
      `<div${attr_class('jse-text-mode svelte-1sed3tc', void 0, { 'no-main-menu': !mainMenuBar })}>`
    );
    if (mainMenuBar) {
      $$renderer2.push('<!--[-->');
      const isNewDocument = text.length === 0;
      TextMenu($$renderer2, {
        readOnly,
        onExpandAll: handleExpandAll,
        onCollapseAll: handleCollapseAll,
        onFormat: handleFormat,
        onCompact: handleCompact,
        onSort: handleSort,
        onTransform: handleTransform,
        onToggleSearch: handleToggleSearch,
        onUndo: handleUndo,
        onRedo: handleRedo,
        canExpandAll: !isNewDocument,
        canCollapseAll: !isNewDocument,
        canFormat: !isNewDocument,
        canCompact: !isNewDocument,
        canSort: !isNewDocument,
        canTransform: !isNewDocument,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        onRenderMenu
      });
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--> `);
    if (!isSSR) {
      $$renderer2.push('<!--[-->');
      const editorDisabled = disableTextEditor(text, acceptTooLarge);
      $$renderer2.push(
        `<div${attr_class('jse-contents svelte-1sed3tc', void 0, { 'jse-hidden': editorDisabled })}></div> `
      );
      if (editorDisabled) {
        $$renderer2.push('<!--[-->');
        Message($$renderer2, {
          icon: faExclamationTriangle,
          type: 'error',
          message: `The JSON document is larger than ${formatSize(MAX_DOCUMENT_SIZE_TEXT_MODE)}, and may crash your browser when loading it in text mode. Actual size: ${formatSize(text.length)}.`,
          actions: [
            {
              text: 'Open anyway',
              title: 'Open the document in text mode. This may freeze or crash your browser.',
              onClick: handleAcceptTooLarge
            },
            {
              text: 'Open in tree mode',
              title: 'Open the document in tree mode. Tree mode can handle large documents.',
              onClick: handleSwitchToTreeMode
            },
            {
              text: 'Cancel',
              title: 'Cancel opening this large document.',
              onClick: cancelLoadTooLarge
            }
          ],
          onClose: focus
        });
        $$renderer2.push(
          `<!----> <div class="jse-contents jse-preview svelte-1sed3tc">${escape_html(truncate(text || '', MAX_CHARACTERS_TEXT_PREVIEW))}</div>`
        );
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--> `);
      if (!editorDisabled) {
        $$renderer2.push('<!--[-->');
        if (statusBar) {
          $$renderer2.push('<!--[-->');
          StatusBar($$renderer2, { editorState });
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--> `);
        if (jsonParseError) {
          $$renderer2.push('<!--[-->');
          Message($$renderer2, {
            type: 'error',
            icon: faExclamationTriangle,
            message: jsonParseError.message,
            actions: repairActions,
            onClick: handleShowMe,
            onClose: focus
          });
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--> `);
        if (!jsonParseError && askToFormatApplied && needsFormatting(text)) {
          $$renderer2.push('<!--[-->');
          Message($$renderer2, {
            type: 'success',
            message: 'Do you want to format the JSON?',
            actions: [
              {
                icon: faJSONEditorFormat,
                text: 'Format',
                title: 'Format JSON: add proper indentation and new lines (Ctrl+I)',
                onClick: handleFormat
              },
              {
                icon: faTimes,
                text: 'No thanks',
                title: 'Close this message',
                onClick: () => (askToFormatApplied = false)
              }
            ],
            onClose: focus
          });
        } else {
          $$renderer2.push('<!--[!-->');
        }
        $$renderer2.push(`<!--]--> `);
        ValidationErrorsOverview($$renderer2, {
          validationErrors,
          selectError: handleSelectValidationError
        });
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push('<!--[!-->');
      $$renderer2.push(
        `<div class="jse-contents svelte-1sed3tc"><div class="jse-loading-space svelte-1sed3tc"></div> <div class="jse-loading svelte-1sed3tc">loading...</div></div>`
      );
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, {
      readOnly,
      mainMenuBar,
      statusBar,
      askToFormat,
      externalContent,
      externalSelection,
      history,
      indentation,
      tabSize,
      escapeUnicodeCharacters,
      parser,
      validator,
      validationParser,
      onChange,
      onChangeMode,
      onSelect,
      onUndo,
      onRedo,
      onError,
      onFocus,
      onBlur,
      onRenderMenu,
      onSortModal,
      onTransformModal,
      focus,
      collapse,
      expand,
      patch,
      handlePatch,
      openTransformModal,
      refresh,
      flush,
      validate
    });
  });
}
function TableMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let containsValidArray = $$props['containsValidArray'];
    let readOnly = $$props['readOnly'];
    let showSearch = fallback($$props['showSearch'], false);
    let history = $$props['history'];
    let onSort = $$props['onSort'];
    let onTransform = $$props['onTransform'];
    let onContextMenu = $$props['onContextMenu'];
    let onUndo = $$props['onUndo'];
    let onRedo = $$props['onRedo'];
    let onRenderMenu = $$props['onRenderMenu'];
    function handleToggleSearch() {
      showSearch = !showSearch;
    }
    let defaultItems;
    let items;
    defaultItems = !readOnly
      ? [
          {
            type: 'button',
            icon: faSortAmountDownAlt,
            title: 'Sort',
            className: 'jse-sort',
            onClick: onSort,
            disabled: readOnly || !containsValidArray
          },
          {
            type: 'button',
            icon: faFilter,
            title: 'Transform contents (filter, sort, project)',
            className: 'jse-transform',
            onClick: onTransform,
            disabled: readOnly || !containsValidArray
          },
          {
            type: 'button',
            icon: faSearch,
            title: 'Search (Ctrl+F)',
            className: 'jse-search',
            onClick: handleToggleSearch,
            disabled: !containsValidArray
          },
          {
            type: 'button',
            icon: faEllipsisV,
            title: CONTEXT_MENU_EXPLANATION,
            className: 'jse-contextmenu',
            onClick: onContextMenu
          },
          { type: 'separator' },
          {
            type: 'button',
            icon: faUndo,
            title: 'Undo (Ctrl+Z)',
            className: 'jse-undo',
            onClick: onUndo,
            disabled: !history.canUndo
          },
          {
            type: 'button',
            icon: faRedo,
            title: 'Redo (Ctrl+Shift+Z)',
            className: 'jse-redo',
            onClick: onRedo,
            disabled: !history.canRedo
          },
          { type: 'space' }
        ]
      : [{ type: 'space' }];
    items = onRenderMenu(defaultItems) || defaultItems;
    Menu($$renderer2, { items });
    bind_props($$props, {
      containsValidArray,
      readOnly,
      showSearch,
      history,
      onSort,
      onTransform,
      onContextMenu,
      onUndo,
      onRedo,
      onRenderMenu
    });
  });
}
function InlineValue($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let path = $$props['path'];
    let value = $$props['value'];
    let parser = $$props['parser'];
    let isSelected = $$props['isSelected'];
    let containsSearchResult = $$props['containsSearchResult'];
    let containsActiveSearchResult = $$props['containsActiveSearchResult'];
    let onEdit = $$props['onEdit'];
    $$renderer2.push(
      `<button type="button"${attr_class('jse-inline-value svelte-11x5eo4', void 0, {
        'jse-selected': isSelected,
        'jse-highlight': containsSearchResult,
        'jse-active': containsActiveSearchResult
      })}>${escape_html(truncate(parser.stringify(value) ?? '', MAX_INLINE_OBJECT_CHARS))}</button>`
    );
    bind_props($$props, {
      path,
      value,
      parser,
      isSelected,
      containsSearchResult,
      containsActiveSearchResult,
      onEdit
    });
  });
}
function ColumnHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let columnName, sortDirection, sortDirectionName;
    let path = $$props['path'];
    let sortedColumn = $$props['sortedColumn'];
    let readOnly = $$props['readOnly'];
    let onSort = $$props['onSort'];
    columnName = !isEmpty(path) ? stringifyJSONPath(path) : 'values';
    sortDirection =
      sortedColumn && isEqual(path, sortedColumn?.path) ? sortedColumn.sortDirection : void 0;
    sortDirectionName = sortDirection ? SORT_DIRECTION_NAMES[sortDirection] : void 0;
    $$renderer2.push(
      `<button type="button"${attr_class('jse-column-header svelte-jv0pvc', void 0, { 'jse-readonly': readOnly })}${attr('title', !readOnly ? columnName + ' (Click to sort the data by this column)' : columnName)}><span class="jse-column-name">${escape_html(truncate(columnName, MAX_HEADER_NAME_CHARACTERS))}</span> `
    );
    if (sortDirection !== void 0) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<span class="jse-column-sort-icon svelte-jv0pvc"${attr('title', `Currently sorted in ${sortDirectionName} order`)}>`
      );
      Icon($$renderer2, {
        data: sortDirection === SortDirection.asc ? faCaretDown : faCaretUp
      });
      $$renderer2.push(`<!----></span>`);
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></button>`);
    bind_props($$props, { path, sortedColumn, readOnly, onSort });
  });
}
function TableModeWelcome($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const { text, json, readOnly, parser } = $$props;
    const nestedArrayPaths = json
      ? findNestedArrays(json)
          .slice(0, 99)
          .filter((path) => path.length > 0)
      : [];
    const hasNestedArrays = !isEmpty(nestedArrayPaths);
    const isEmptyDocument = json === void 0 && (text === '' || text === void 0);
    const documentType = hasNestedArrays
      ? 'Object with nested arrays'
      : isEmptyDocument
        ? 'An empty document'
        : isJSONObject(json)
          ? 'An object'
          : isJSONArray(json)
            ? 'An empty array'
            : // note: can also be an array with objects but without properties
              `A ${valueType(json, parser)}`;
    function countItems(nestedArrayPath) {
      return getIn(json, nestedArrayPath).length;
    }
    $$renderer2.push(
      `<div class="jse-table-mode-welcome svelte-t7oile" role="none"><div class="jse-space jse-before svelte-t7oile"></div> <div class="jse-nested-arrays svelte-t7oile"><div class="jse-nested-arrays-title">${escape_html(documentType)}</div> <div class="jse-nested-arrays-info svelte-t7oile">`
    );
    if (hasNestedArrays) {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(`An object cannot be opened in table mode. You can open a nested array instead, or open the
        document in tree mode.`);
    } else {
      $$renderer2.push('<!--[!-->');
      if (isEmptyDocument && !readOnly) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(`An empty document cannot be opened in table mode. You can go to tree mode instead, or paste
        a JSON Array using <b>Ctrl+V</b>.`);
      } else {
        $$renderer2.push('<!--[!-->');
        $$renderer2.push(
          `${escape_html(documentType)} cannot be opened in table mode. You can open the document in tree mode instead.`
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <!--[-->`);
    const each_array = ensure_array_like(nestedArrayPaths);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let nestedArrayPath = each_array[$$index];
      const count = countItems(nestedArrayPath);
      $$renderer2.push(
        `<div class="jse-nested-property svelte-t7oile"><div class="jse-nested-property-path svelte-t7oile">"${escape_html(stringifyJSONPath(nestedArrayPath))}" <span class="jse-nested-property-count svelte-t7oile">(${escape_html(count)} ${escape_html(count !== 1 ? 'items' : 'item')})</span></div> <button type="button" class="jse-nested-array-action svelte-t7oile">${escape_html(readOnly ? 'View' : 'Edit')}</button> `
      );
      if (!readOnly) {
        $$renderer2.push('<!--[-->');
        $$renderer2.push(
          `<button type="button" class="jse-nested-array-action svelte-t7oile">Extract</button>`
        );
      } else {
        $$renderer2.push('<!--[!-->');
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(
      `<!--]--> <button type="button" class="jse-nested-array-action svelte-t7oile">Switch to tree mode</button></div> <div class="jse-space jse-after svelte-t7oile"></div></div>`
    );
  });
}
function RefreshColumnHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let count = $$props['count'];
    let maxSampleCount = $$props['maxSampleCount'];
    let readOnly = $$props['readOnly'];
    let onRefresh = $$props['onRefresh'];
    $$renderer2.push(
      `<button type="button"${attr_class('jse-column-header svelte-gfc1zr', void 0, { 'jse-readonly': readOnly })}${attr('title', `The Columns are created by sampling ${maxSampleCount} items out of ${count}. If you're missing a column, click here to sample all of the items instead of a subset. This is slower.`)}>`
    );
    Icon($$renderer2, { data: faRotate });
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { count, maxSampleCount, readOnly, onRefresh });
  });
}
function createTableContextMenuItems({
  json,
  documentState,
  selection,
  readOnly,
  onEditValue,
  onEditRow,
  onToggleEnforceString,
  onCut: onCut2,
  onCopy: onCopy2,
  onPaste: onPaste2,
  onRemove: onRemove2,
  onDuplicateRow: onDuplicateRow2,
  onInsertBeforeRow: onInsertBeforeRow2,
  onInsertAfterRow: onInsertAfterRow2,
  onRemoveRow: onRemoveRow2
}) {
  const hasJson = json !== void 0;
  const hasSelection = !!selection;
  const focusValue = json !== void 0 && selection ? getIn(json, getFocusPath(selection)) : void 0;
  const hasSelectionContents2 =
    hasJson &&
    (isMultiSelection(selection) || isKeySelection(selection) || isValueSelection(selection));
  const canEditValue =
    !readOnly && hasJson && selection !== void 0 && singleItemSelected(selection);
  const canEnforceString = canEditValue && !isObjectOrArray(focusValue);
  const canCut = !readOnly && hasSelectionContents2;
  const enforceString =
    selection !== void 0 ? getEnforceString(json, documentState, getFocusPath(selection)) : false;
  return [
    { type: 'separator' },
    {
      type: 'row',
      items: [
        {
          type: 'column',
          items: [
            { type: 'label', text: 'Table cell:' },
            {
              type: 'dropdown-button',
              main: {
                type: 'button',
                onClick: () => onEditValue(),
                icon: faPen,
                text: 'Edit',
                title: 'Edit the value (Double-click on the value)',
                disabled: !canEditValue
              },
              width: '11em',
              items: [
                {
                  type: 'button',
                  icon: faPen,
                  text: 'Edit',
                  title: 'Edit the value (Double-click on the value)',
                  onClick: () => onEditValue(),
                  disabled: !canEditValue
                },
                {
                  type: 'button',
                  icon: enforceString ? faCheckSquare$1 : faSquare$1,
                  text: 'Enforce string',
                  title: 'Enforce keeping the value as string when it contains a numeric value',
                  onClick: () => onToggleEnforceString(),
                  disabled: !canEnforceString
                }
              ]
            },
            {
              type: 'dropdown-button',
              main: {
                type: 'button',
                onClick: () => onCut2(true),
                icon: faCut,
                text: 'Cut',
                title: 'Cut selected contents, formatted with indentation (Ctrl+X)',
                disabled: !canCut
              },
              width: '10em',
              items: [
                {
                  type: 'button',
                  icon: faCut,
                  text: 'Cut formatted',
                  title: 'Cut selected contents, formatted with indentation (Ctrl+X)',
                  onClick: () => onCut2(true),
                  disabled: readOnly || !hasSelectionContents2
                },
                {
                  type: 'button',
                  icon: faCut,
                  text: 'Cut compacted',
                  title: 'Cut selected contents, without indentation (Ctrl+Shift+X)',
                  onClick: () => onCut2(false),
                  disabled: readOnly || !hasSelectionContents2
                }
              ]
            },
            {
              type: 'dropdown-button',
              main: {
                type: 'button',
                onClick: () => onCopy2(true),
                icon: faCopy,
                text: 'Copy',
                title: 'Copy selected contents, formatted with indentation (Ctrl+C)',
                disabled: !hasSelectionContents2
              },
              width: '12em',
              items: [
                {
                  type: 'button',
                  icon: faCopy,
                  text: 'Copy formatted',
                  title: 'Copy selected contents, formatted with indentation (Ctrl+C)',
                  onClick: () => onCopy2(false),
                  disabled: !hasSelectionContents2
                },
                {
                  type: 'button',
                  icon: faCopy,
                  text: 'Copy compacted',
                  title: 'Copy selected contents, without indentation (Ctrl+Shift+C)',
                  onClick: () => onCopy2(false),
                  disabled: !hasSelectionContents2
                }
              ]
            },
            {
              type: 'button',
              onClick: () => onPaste2(),
              icon: faPaste,
              text: 'Paste',
              title: 'Paste clipboard contents (Ctrl+V)',
              disabled: readOnly || !hasSelection
            },
            {
              type: 'button',
              onClick: () => onRemove2(),
              icon: faTrashCan,
              text: 'Remove',
              title: 'Remove selected contents (Delete)',
              disabled: readOnly || !hasSelectionContents2
            }
          ]
        },
        {
          type: 'column',
          items: [
            { type: 'label', text: 'Table row:' },
            {
              type: 'button',
              onClick: () => onEditRow(),
              icon: faPen,
              text: 'Edit row',
              title: 'Edit the current row',
              disabled: readOnly || !hasSelection || !hasJson
            },
            {
              type: 'button',
              onClick: () => onDuplicateRow2(),
              icon: faClone,
              text: 'Duplicate row',
              title: 'Duplicate the current row (Ctrl+D)',
              disabled: readOnly || !hasSelection || !hasJson
            },
            {
              type: 'button',
              onClick: () => onInsertBeforeRow2(),
              icon: faPlus,
              text: 'Insert before',
              title: 'Insert a row before the current row',
              disabled: readOnly || !hasSelection || !hasJson
            },
            {
              type: 'button',
              onClick: () => onInsertAfterRow2(),
              icon: faPlus,
              text: 'Insert after',
              title: 'Insert a row after the current row',
              disabled: readOnly || !hasSelection || !hasJson
            },
            {
              type: 'button',
              onClick: () => onRemoveRow2(),
              icon: faTrashCan,
              text: 'Remove row',
              title: 'Remove current row',
              disabled: readOnly || !hasSelection || !hasJson
            }
          ]
        }
      ]
    }
  ];
}
function TableMode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let showRefreshButton, visibleSection, groupedValidationErrors;
    const debug2 = createDebug('jsoneditor:TableMode');
    const { openAbsolutePopup, closeAbsolutePopup } = getContext('absolute-popup');
    const sortModalId = uniqueId$1();
    const transformModalId = uniqueId$1();
    const isSSR = typeof window === 'undefined';
    debug2('isSSR:', isSSR);
    let readOnly = $$props['readOnly'];
    let externalContent = $$props['externalContent'];
    let externalSelection = $$props['externalSelection'];
    let history = $$props['history'];
    let truncateTextSize = $$props['truncateTextSize'];
    let mainMenuBar = $$props['mainMenuBar'];
    let escapeControlCharacters = $$props['escapeControlCharacters'];
    let escapeUnicodeCharacters = $$props['escapeUnicodeCharacters'];
    let flattenColumns = $$props['flattenColumns'];
    let parser = $$props['parser'];
    let parseMemoizeOne = $$props['parseMemoizeOne'];
    let validator = $$props['validator'];
    let validationParser = $$props['validationParser'];
    let indentation = $$props['indentation'];
    let onChange = $$props['onChange'];
    let onChangeMode = $$props['onChangeMode'];
    let onSelect = $$props['onSelect'];
    let onUndo = $$props['onUndo'];
    let onRedo = $$props['onRedo'];
    let onRenderValue = $$props['onRenderValue'];
    let onRenderMenu = $$props['onRenderMenu'];
    let onRenderContextMenu = $$props['onRenderContextMenu'];
    let onFocus = $$props['onFocus'];
    let onBlur = $$props['onBlur'];
    let onSortModal = $$props['onSortModal'];
    let onTransformModal = $$props['onTransformModal'];
    let onJSONEditorModal = $$props['onJSONEditorModal'];
    let normalization;
    let refJsonEditor;
    let jsonRepairModalProps = void 0;
    createFocusTracker({
      onMount: noop$2,
      onDestroy,
      getWindow: () => getWindow(refJsonEditor),
      hasFocus: () => (modalOpen && document.hasFocus()) || activeElementIsChildOf(refJsonEditor),
      onFocus: () => {
        if (onFocus) {
          onFocus();
        }
      },
      onBlur: () => {
        if (onBlur) {
          onBlur();
        }
      }
    });
    let json;
    let text;
    let parseError = void 0;
    let pastedJson;
    let pastedMultilineText;
    let searchResultDetails;
    let searchResults;
    let showSearch = false;
    let showReplace = false;
    function handleSearch(result) {
      searchResultDetails = result;
      searchResults = searchResultDetails
        ? toRecursiveSearchResults(json, searchResultDetails.items)
        : void 0;
    }
    async function handleFocusSearch(path) {
      selection = void 0;
      await scrollTo(path);
    }
    function handleCloseSearch() {
      showSearch = false;
      showReplace = false;
      focus();
    }
    let maxSampleCount = 1e4;
    let columns = [];
    let containsValidArray;
    let modalOpen = false;
    let copyPasteModalOpen = false;
    let itemHeightsCache = {};
    let viewPortHeight = 600;
    let scrollTop = 0;
    let defaultItemHeight = 18;
    function handleSelect(updatedSelection) {
      selection = updatedSelection;
    }
    function emitOnSelect(updatedSelection) {
      if (!isEqual(updatedSelection, externalSelection)) {
        debug2('onSelect', updatedSelection);
        onSelect(updatedSelection);
      }
    }
    function clearSelectionWhenNotExisting(json2) {
      if (!selection || json2 === void 0) {
        return;
      }
      if (existsIn(json2, getAnchorPath(selection)) && existsIn(json2, getFocusPath(selection))) {
        return;
      }
      debug2('clearing selection: path does not exist anymore', selection);
      selection = void 0;
    }
    let documentState = json !== void 0 ? createDocumentState({ json }) : void 0;
    let selection = isJSONSelection(externalSelection) ? externalSelection : void 0;
    let sortedColumn;
    let textIsRepaired = false;
    function onSortByHeader(newSortedColumn) {
      if (readOnly) {
        return;
      }
      debug2('onSortByHeader', newSortedColumn);
      const rootPath = [];
      const direction = newSortedColumn.sortDirection === SortDirection.desc ? -1 : 1;
      const operations = sortJson(json, rootPath, newSortedColumn.path, direction);
      handlePatch(operations, (_, patchedState) => {
        return { state: patchedState, sortedColumn: newSortedColumn };
      });
    }
    let context;
    function applyExternalContent(content) {
      const currentContent = { json };
      const isChanged = isTextContent(content)
        ? content.text !== text
        : !isEqual(currentContent.json, content.json);
      debug2('update external content', { isChanged });
      if (!isChanged) {
        return;
      }
      const previousState = {
        json,
        documentState,
        selection,
        sortedColumn,
        text,
        textIsRepaired
      };
      if (isTextContent(content)) {
        try {
          json = parseMemoizeOne(content.text);
          documentState = syncDocumentState(json, documentState);
          text = content.text;
          textIsRepaired = false;
          parseError = void 0;
        } catch (err) {
          try {
            json = parseMemoizeOne(jsonrepair(content.text));
            documentState = syncDocumentState(json, documentState);
            text = content.text;
            textIsRepaired = true;
            parseError = void 0;
          } catch {
            json = void 0;
            documentState = void 0;
            text = content.text;
            textIsRepaired = false;
            parseError =
              text !== '' ? normalizeJsonParseError(text, err.message || String(err)) : void 0;
          }
        }
      } else {
        json = content.json;
        documentState = syncDocumentState(json, documentState);
        text = void 0;
        textIsRepaired = false;
        parseError = void 0;
      }
      clearSelectionWhenNotExisting(json);
      sortedColumn = void 0;
      addHistoryItem(previousState);
    }
    function applyExternalSelection(externalSelection2) {
      if (isEqual(selection, externalSelection2)) {
        return;
      }
      debug2('applyExternalSelection', { selection, externalSelection: externalSelection2 });
      if (isJSONSelection(externalSelection2)) {
        selection = externalSelection2;
      }
    }
    function addHistoryItem(previous) {
      if (previous.json === void 0 && previous.text === void 0) {
        return;
      }
      const canPatch = json !== void 0 && previous.json !== void 0;
      history.add({
        type: 'tree',
        undo: {
          patch: canPatch ? [{ op: 'replace', path: '', value: previous.json }] : void 0,
          json: previous.json,
          text: previous.text,
          documentState: previous.documentState,
          textIsRepaired: previous.textIsRepaired,
          selection: removeEditModeFromSelection(previous.selection),
          sortedColumn: previous.sortedColumn
        },
        redo: {
          patch: canPatch ? [{ op: 'replace', path: '', value: json }] : void 0,
          json,
          text,
          documentState,
          textIsRepaired,
          selection: removeEditModeFromSelection(selection),
          sortedColumn
        }
      });
    }
    let validationErrors = [];
    const memoizedValidate = memoizeOne(validateJSON);
    function updateValidationErrors(json2, validator2, parser2, validationParser2) {
      measure(
        () => {
          let newValidationErrors;
          try {
            newValidationErrors = memoizedValidate(json2, validator2, parser2, validationParser2);
          } catch (err) {
            newValidationErrors = [
              {
                path: [],
                message: 'Failed to validate: ' + err.message,
                severity: ValidationSeverity.warning
              }
            ];
          }
          if (!isEqual(newValidationErrors, validationErrors)) {
            debug2('validationErrors changed:', newValidationErrors);
            validationErrors = newValidationErrors;
          }
        },
        (duration) => debug2(`validationErrors updated in ${duration} ms`)
      );
    }
    function validate() {
      debug2('validate');
      if (parseError) {
        return {
          parseError,
          isRepairable: false
          // not applicable, if repairable, we will not have a parseError
        };
      }
      updateValidationErrors(json, validator, parser, validationParser);
      return !isEmpty(validationErrors) ? { validationErrors } : void 0;
    }
    function patch(operations, afterPatch) {
      debug2('patch', operations, afterPatch);
      if (json === void 0) {
        throw new Error('Cannot apply patch: no JSON');
      }
      const previousJson = json;
      const previousState = {
        json: void 0,
        // not needed: we use patch to reconstruct the json
        text,
        documentState,
        selection: removeEditModeFromSelection(selection),
        sortedColumn,
        textIsRepaired
      };
      const undo = revertJSONPatchWithMoveOperations(json, operations);
      const patched = documentStatePatch(json, documentState, operations);
      const patchedSortedColumn = clearSortedColumnWhenAffectedByOperations(
        sortedColumn,
        operations,
        columns
      );
      const callback =
        typeof afterPatch === 'function'
          ? afterPatch(patched.json, patched.documentState, selection)
          : void 0;
      json = callback?.json !== void 0 ? callback.json : patched.json;
      documentState = callback?.state !== void 0 ? callback.state : patched.documentState;
      selection = callback?.selection !== void 0 ? callback.selection : selection;
      sortedColumn =
        callback?.sortedColumn !== void 0 ? callback.sortedColumn : patchedSortedColumn;
      text = void 0;
      textIsRepaired = false;
      pastedJson = void 0;
      pastedMultilineText = void 0;
      parseError = void 0;
      history.add({
        type: 'tree',
        undo: { patch: undo, ...previousState },
        redo: {
          patch: operations,
          json: void 0,
          // not needed: we use patch to reconstruct the json
          text: void 0,
          documentState,
          selection: removeEditModeFromSelection(selection),
          sortedColumn,
          textIsRepaired
        }
      });
      return { json, previousJson, undo, redo: operations };
    }
    function handlePatch(operations, afterPatch) {
      debug2('handlePatch', operations, afterPatch);
      const previousContent = { json, text };
      const patchResult = patch(operations, afterPatch);
      emitOnChange(previousContent, patchResult);
      return patchResult;
    }
    function emitOnChange(previousContent, patchResult) {
      if (previousContent.json === void 0 && previousContent?.text === void 0) {
        return;
      }
      if (onChange) {
        if (text !== void 0) {
          const content = { text, json: void 0 };
          onChange(content, previousContent, { contentErrors: validate(), patchResult });
        } else if (json !== void 0) {
          const content = { text: void 0, json };
          onChange(content, previousContent, { contentErrors: validate(), patchResult });
        }
      }
    }
    function handlePasteJson(newPastedJson) {
      debug2('pasted json as text', newPastedJson);
      pastedJson = newPastedJson;
    }
    function handlePasteMultilineText(pastedText) {
      debug2('pasted multiline text', { pastedText });
      pastedMultilineText = pastedText;
    }
    function findNextInside(path) {
      const index = parseInt(path[0], 10);
      const nextPath = [String(index + 1), ...path.slice(1)];
      return existsIn(json, nextPath) ? createValueSelection(nextPath) : createValueSelection(path);
    }
    function focus() {
      debug2('focus');
    }
    function acceptAutoRepair() {
      if (textIsRepaired && json !== void 0) {
        const previousContent = { json, text };
        const previousState = {
          json,
          documentState,
          selection,
          sortedColumn,
          text,
          textIsRepaired
        };
        text = void 0;
        textIsRepaired = false;
        clearSelectionWhenNotExisting(json);
        addHistoryItem(previousState);
        const patchResult = void 0;
        emitOnChange(previousContent, patchResult);
      }
      return { json, text };
    }
    function scrollTo(path, { scrollToWhenVisible = true } = {}) {
      const top = calculateAbsolutePosition(path, columns, itemHeightsCache, defaultItemHeight);
      const elem = findElement(path);
      debug2('scrollTo', { path, top, scrollTop, elem });
      {
        return Promise.resolve();
      }
    }
    function findElement(path) {
      const column = columns.find((c) => pathStartsWith(path.slice(1), c));
      column ? path.slice(0, 1).concat(column) : path;
      return void 0;
    }
    function openContextMenu({ anchor, left, top, width, height, offsetTop, offsetLeft, showTip }) {
      const defaultItems = createTableContextMenuItems({
        json,
        documentState,
        selection,
        readOnly,
        onEditValue: handleEditValue,
        onEditRow: handleEditRow,
        onToggleEnforceString: handleToggleEnforceString,
        onCut: handleCut,
        onCopy: handleCopy,
        onPaste: handlePasteFromMenu,
        onRemove: handleRemove,
        onDuplicateRow: handleDuplicateRow,
        onInsertBeforeRow: handleInsertBeforeRow,
        onInsertAfterRow: handleInsertAfterRow,
        onRemoveRow: handleRemoveRow
      });
      const items = onRenderContextMenu(defaultItems) ?? defaultItems;
      if (items === false) {
        return;
      }
      const props = {
        tip: showTip
          ? 'Tip: you can open this context menu via right-click or with Ctrl+Q'
          : void 0,
        items,
        onRequestClose() {
          closeAbsolutePopup(popupId);
          focus();
        }
      };
      const options = {
        left,
        top,
        offsetTop,
        offsetLeft,
        width,
        height,
        anchor,
        closeOnOuterClick: true,
        onClose: () => {
          modalOpen = false;
          focus();
        }
      };
      modalOpen = true;
      const popupId = openAbsolutePopup(ContextMenu, props, options);
    }
    function handleContextMenuFromTableMenu(event) {
      openContextMenu({
        anchor: findParentWithNodeName(event.target, 'BUTTON'),
        offsetTop: 0,
        width: CONTEXT_MENU_WIDTH,
        height: CONTEXT_MENU_HEIGHT,
        showTip: true
      });
    }
    function handleEditValue() {
      if (readOnly || !selection) {
        return;
      }
      const path = getFocusPath(selection);
      const value = getIn(json, path);
      if (isObjectOrArray(value)) {
        openJSONEditorModal(path);
      } else {
        selection = createValueSelection(path);
      }
    }
    function handleEditRow() {
      if (readOnly || !selection) {
        return;
      }
      const path = getFocusPath(selection);
      const pathRow = path.slice(0, 1);
      openJSONEditorModal(pathRow);
    }
    function handleToggleEnforceString() {
      if (readOnly || !isValueSelection(selection)) {
        return;
      }
      const path = selection.path;
      const pointer = compileJSONPointer(path);
      const value = getIn(json, path);
      const enforceString = !getEnforceString(json, documentState, path);
      const updatedValue = enforceString ? String(value) : stringConvert(String(value), parser);
      debug2('handleToggleEnforceString', { enforceString, value, updatedValue });
      handlePatch([{ op: 'replace', path: pointer, value: updatedValue }], (_, patchedState) => {
        return {
          state: setInDocumentState(json, patchedState, path, { type: 'value', enforceString })
        };
      });
    }
    async function handleParsePastedJson() {
      debug2('apply pasted json', pastedJson);
      if (!pastedJson) {
        return;
      }
      const { onPasteAsJson } = pastedJson;
      onPasteAsJson();
      setTimeout(focus);
    }
    async function handlePasteFromMenu() {
      try {
        const clipboardText = await navigator.clipboard.readText();
        _paste(clipboardText);
      } catch (err) {
        console.error(err);
        copyPasteModalOpen = true;
      }
    }
    async function handleParsePastedMultilineText() {
      debug2('apply pasted multiline text', pastedMultilineText);
      if (!pastedMultilineText) {
        return;
      }
      _paste(JSON.stringify(pastedMultilineText));
      setTimeout(focus);
    }
    function handleClearPastedJson() {
      debug2('clear pasted json');
      pastedJson = void 0;
      focus();
    }
    function handleClearPastedMultilineText() {
      debug2('clear pasted multiline text');
      pastedMultilineText = void 0;
      focus();
    }
    function handleRequestRepair() {
      onChangeMode(Mode.text);
    }
    async function handleCut(indent) {
      await onCut({
        json,
        selection,
        indentation: indent ? indentation : void 0,
        readOnly,
        parser,
        onPatch: handlePatch
      });
    }
    async function handleCopy(indent = true) {
      if (json === void 0) {
        return;
      }
      await onCopy({
        json,
        selection,
        indentation: indent ? indentation : void 0,
        parser
      });
    }
    function handleRemove() {
      onRemove({
        json,
        text,
        selection,
        keepSelection: true,
        readOnly,
        onChange,
        onPatch: handlePatch
      });
    }
    function handleDuplicateRow() {
      onDuplicateRow({ json, selection, columns, readOnly, onPatch: handlePatch });
    }
    function handleInsertBeforeRow() {
      onInsertBeforeRow({ json, selection, columns, readOnly, onPatch: handlePatch });
    }
    function handleInsertAfterRow() {
      onInsertAfterRow({ json, selection, columns, readOnly, onPatch: handlePatch });
    }
    function handleRemoveRow() {
      onRemoveRow({ json, selection, columns, readOnly, onPatch: handlePatch });
    }
    function _paste(clipboardText) {
      if (clipboardText === void 0) {
        return;
      }
      onPaste({
        clipboardText,
        json,
        selection,
        readOnly,
        parser,
        onPatch: handlePatch,
        onChangeText: handleChangeText,
        onPasteMultilineText: handlePasteMultilineText,
        openRepairModal
      });
    }
    function handleChangeText(updatedText, afterPatch) {
      debug2('handleChangeText');
      const previousContent = { json, text };
      const previousState = {
        json,
        documentState,
        selection,
        sortedColumn,
        text,
        textIsRepaired
      };
      try {
        json = parseMemoizeOne(updatedText);
        documentState = syncDocumentState(json, documentState);
        text = void 0;
        textIsRepaired = false;
        parseError = void 0;
      } catch (err) {
        try {
          json = parseMemoizeOne(jsonrepair(updatedText));
          documentState = syncDocumentState(json, documentState);
          text = updatedText;
          textIsRepaired = true;
          parseError = void 0;
        } catch {
          json = void 0;
          documentState = void 0;
          text = updatedText;
          textIsRepaired = false;
          parseError =
            text !== '' ? normalizeJsonParseError(text, err.message || String(err)) : void 0;
        }
      }
      if (typeof afterPatch === 'function') {
        const callback = afterPatch(json, documentState, selection);
        json = callback?.json !== void 0 ? callback.json : json;
        documentState = callback?.state !== void 0 ? callback.state : documentState;
        selection = callback?.selection !== void 0 ? callback.selection : selection;
      }
      clearSelectionWhenNotExisting(json);
      addHistoryItem(previousState);
      const patchResult = void 0;
      emitOnChange(previousContent, patchResult);
    }
    function handleSelectValidationError(error) {
      debug2('select validation error', error);
      selection = createValueSelection(error.path);
      scrollTo(error.path);
    }
    function openSortModal(rootPath) {
      if (readOnly || json === void 0) {
        return;
      }
      modalOpen = true;
      onSortModal({
        id: sortModalId,
        json,
        rootPath,
        onSort: ({ operations, itemPath, direction }) => {
          debug2('onSort', operations, rootPath, itemPath, direction);
          handlePatch(operations, (_, patchedState) => {
            return {
              state: patchedState,
              sortedColumn: {
                path: itemPath,
                sortDirection: direction === -1 ? SortDirection.desc : SortDirection.asc
              }
            };
          });
        },
        onClose: () => {
          modalOpen = false;
          setTimeout(focus);
        }
      });
    }
    function openTransformModal(options) {
      if (json === void 0) {
        return;
      }
      const { id: id2, onTransform, onClose } = options;
      const rootPath = options.rootPath || [];
      modalOpen = true;
      onTransformModal({
        id: id2 || transformModalId,
        json,
        rootPath: rootPath || [],
        onTransform: (operations) => {
          if (onTransform) {
            onTransform({
              operations,
              json,
              transformedJson: immutableJSONPatch(json, operations)
            });
          } else {
            debug2('onTransform', rootPath, operations);
            handlePatch(operations);
          }
        },
        onClose: () => {
          modalOpen = false;
          setTimeout(focus);
          if (onClose) {
            onClose();
          }
        }
      });
    }
    function openJSONEditorModal(path) {
      debug2('openJSONEditorModal', { path });
      modalOpen = true;
      onJSONEditorModal({
        content: { json: getIn(json, path) },
        path,
        onPatch: handlePatch,
        onClose: () => {
          modalOpen = false;
          setTimeout(focus);
        }
      });
    }
    function openRepairModal(text2, onApply) {
      jsonRepairModalProps = {
        text: text2,
        onParse: (text3) => parsePartialJson(text3, (t) => parseAndRepair(t, parser)),
        onRepair: repairPartialJson,
        onApply,
        onClose: focus
      };
    }
    function handleSortAll() {
      const rootPath = [];
      openSortModal(rootPath);
    }
    function handleTransformAll() {
      openTransformModal({ rootPath: [] });
    }
    function openFind(findAndReplace) {
      debug2('openFind', { findAndReplace });
      showSearch = false;
      showReplace = false;
      showSearch = true;
      showReplace = findAndReplace;
    }
    function handleUndo() {
      if (readOnly) {
        return;
      }
      if (!history.canUndo) {
        return;
      }
      const item = history.undo();
      if (!isTreeHistoryItem(item)) {
        onUndo(item);
        return;
      }
      const previousContent = { json, text };
      json = item.undo.patch ? immutableJSONPatch(json, item.undo.patch) : item.undo.json;
      documentState = item.undo.documentState;
      selection = item.undo.selection;
      sortedColumn = item.undo.sortedColumn;
      text = item.undo.text;
      textIsRepaired = item.undo.textIsRepaired;
      parseError = void 0;
      debug2('undo', { item, json });
      const patchResult =
        item.undo.patch && item.redo.patch
          ? {
              json,
              previousJson: previousContent.json,
              redo: item.undo.patch,
              undo: item.redo.patch
            }
          : void 0;
      emitOnChange(previousContent, patchResult);
      focus();
      if (selection) {
        scrollTo(getFocusPath(selection), { scrollToWhenVisible: false });
      }
    }
    function handleRedo() {
      if (readOnly) {
        return;
      }
      if (!history.canRedo) {
        return;
      }
      const item = history.redo();
      if (!isTreeHistoryItem(item)) {
        onRedo(item);
        return;
      }
      const previousContent = { json, text };
      json = item.redo.patch ? immutableJSONPatch(json, item.redo.patch) : item.redo.json;
      documentState = item.redo.documentState;
      selection = item.redo.selection;
      sortedColumn = item.redo.sortedColumn;
      text = item.redo.text;
      textIsRepaired = item.redo.textIsRepaired;
      parseError = void 0;
      debug2('redo', { item, json });
      const patchResult =
        item.undo.patch && item.redo.patch
          ? {
              json,
              previousJson: previousContent.json,
              redo: item.redo.patch,
              undo: item.undo.patch
            }
          : void 0;
      emitOnChange(previousContent, patchResult);
      focus();
      if (selection) {
        scrollTo(getFocusPath(selection), { scrollToWhenVisible: false });
      }
    }
    normalization = createNormalizationFunctions({
      escapeControlCharacters,
      escapeUnicodeCharacters
    });
    applyExternalContent(externalContent);
    applyExternalSelection(externalSelection);
    columns = isJSONArray(json)
      ? maintainColumnOrder(getColumns(json, flattenColumns, maxSampleCount), columns)
      : [];
    containsValidArray = !!(json && !isEmpty(columns));
    showRefreshButton = Array.isArray(json) && json.length > maxSampleCount;
    visibleSection = calculateVisibleSection(
      scrollTop,
      viewPortHeight,
      json,
      itemHeightsCache,
      defaultItemHeight,
      showSearch ? SEARCH_BOX_HEIGHT : 0
    );
    emitOnSelect(selection);
    context = {
      mode: Mode.table,
      readOnly,
      truncateTextSize,
      parser,
      normalization,
      getJson: () => json,
      getDocumentState: () => documentState,
      findElement,
      findNextInside,
      focus,
      onPatch: (operations, afterPatch) => {
        return handlePatch(createNestedValueOperations(operations, json), afterPatch);
      },
      onSelect: handleSelect,
      onFind: openFind,
      onPasteJson: handlePasteJson,
      onRenderValue
    };
    updateValidationErrors(json, validator, parser, validationParser);
    groupedValidationErrors = groupValidationErrors(validationErrors, columns);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(
        `<div role="table"${attr_class('jse-table-mode svelte-m90oz6', void 0, { 'no-main-menu': !mainMenuBar })}>`
      );
      if (mainMenuBar) {
        $$renderer3.push('<!--[-->');
        TableMenu($$renderer3, {
          containsValidArray,
          readOnly,
          history,
          onSort: handleSortAll,
          onTransform: handleTransformAll,
          onUndo: handleUndo,
          onRedo: handleRedo,
          onContextMenu: handleContextMenuFromTableMenu,
          onRenderMenu,
          get showSearch() {
            return showSearch;
          },
          set showSearch($$value) {
            showSearch = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push('<!--[!-->');
      }
      $$renderer3.push(`<!--]--> `);
      if (!isSSR) {
        $$renderer3.push('<!--[-->');
        $$renderer3.push(
          `<label class="jse-hidden-input-label svelte-m90oz6"><input type="text"${attr('readonly', true, true)} tabindex="-1" class="jse-hidden-input svelte-m90oz6"/></label> `
        );
        if (containsValidArray) {
          $$renderer3.push('<!--[-->');
          $$renderer3.push(`<div class="jse-search-box-container svelte-m90oz6">`);
          SearchBox($$renderer3, {
            json,
            documentState,
            parser,
            showSearch,
            showReplace,
            readOnly,
            columns,
            onSearch: handleSearch,
            onFocus: handleFocusSearch,
            onPatch: handlePatch,
            onClose: handleCloseSearch
          });
          $$renderer3.push(
            `<!----></div> <div class="jse-contents svelte-m90oz6"><table class="jse-table-main svelte-m90oz6"><tbody><tr class="jse-table-row jse-table-row-header svelte-m90oz6"><th class="jse-table-cell jse-table-cell-header svelte-m90oz6">`
          );
          if (!isEmpty(groupedValidationErrors?.root)) {
            $$renderer3.push('<!--[-->');
            const validationError = mergeValidationErrors([], groupedValidationErrors?.root);
            if (validationError) {
              $$renderer3.push('<!--[-->');
              $$renderer3.push(`<div class="jse-table-root-error svelte-m90oz6">`);
              ValidationErrorIcon($$renderer3, { validationError, onExpand: noop });
              $$renderer3.push(`<!----></div>`);
            } else {
              $$renderer3.push('<!--[!-->');
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--></th><!--[-->`);
          const each_array = ensure_array_like(columns);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let column = each_array[$$index];
            $$renderer3.push(`<th class="jse-table-cell jse-table-cell-header svelte-m90oz6">`);
            ColumnHeader($$renderer3, {
              path: column,
              sortedColumn,
              readOnly,
              onSort: onSortByHeader
            });
            $$renderer3.push(`<!----></th>`);
          }
          $$renderer3.push(`<!--]-->`);
          if (showRefreshButton) {
            $$renderer3.push('<!--[-->');
            $$renderer3.push(`<th class="jse-table-cell jse-table-cell-header svelte-m90oz6">`);
            RefreshColumnHeader($$renderer3, {
              count: Array.isArray(json) ? json.length : 0,
              maxSampleCount,
              readOnly,
              onRefresh: () => (maxSampleCount = Infinity)
            });
            $$renderer3.push(`<!----></th>`);
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(
            `<!--]--></tr><tr${attr_class('jse-table-invisible-start-section svelte-m90oz6', void 0, { 'jse-search-box-background': showSearch })}><td${attr('colspan', columns.length)} class="svelte-m90oz6"${attr_style('', { height: visibleSection.startHeight + 'px' })}></td></tr><!--[-->`
          );
          const each_array_1 = ensure_array_like(visibleSection.visibleItems);
          for (
            let visibleIndex = 0, $$length = each_array_1.length;
            visibleIndex < $$length;
            visibleIndex++
          ) {
            let item = each_array_1[visibleIndex];
            const rowIndex = visibleSection.startIndex + visibleIndex;
            const validationErrorsByRow = groupedValidationErrors.rows[rowIndex];
            const validationError = mergeValidationErrors(
              [String(rowIndex)],
              validationErrorsByRow?.row
            );
            const searchResultByRow = getInRecursiveState(json, searchResults, [String(rowIndex)]);
            $$renderer3.push(`<tr class="jse-table-row svelte-m90oz6"><!---->`);
            {
              $$renderer3.push(
                `<th class="jse-table-cell jse-table-cell-gutter svelte-m90oz6">${escape_html(rowIndex)} `
              );
              if (validationError) {
                $$renderer3.push('<!--[-->');
                ValidationErrorIcon($$renderer3, { validationError, onExpand: noop });
              } else {
                $$renderer3.push('<!--[!-->');
              }
              $$renderer3.push(`<!--]--></th>`);
            }
            $$renderer3.push(`<!----><!--[-->`);
            const each_array_2 = ensure_array_like(columns);
            for (
              let columnIndex = 0, $$length2 = each_array_2.length;
              columnIndex < $$length2;
              columnIndex++
            ) {
              let column = each_array_2[columnIndex];
              const path = [String(rowIndex)].concat(column);
              const value = getIn(item, column);
              const isSelected =
                isValueSelection(selection) && pathStartsWith(selection.path, path);
              const validationErrorsByColumn = validationErrorsByRow?.columns[columnIndex];
              const validationError2 = mergeValidationErrors(path, validationErrorsByColumn);
              $$renderer3.push(
                `<td class="jse-table-cell svelte-m90oz6"${attr('data-path', encodeDataPath(path))}><div${attr_class('jse-value-outer svelte-m90oz6', void 0, { 'jse-selected-value': isSelected })}>`
              );
              if (isObjectOrArray(value)) {
                $$renderer3.push('<!--[-->');
                const searchResultsByCell = flattenSearchResults(
                  getInRecursiveState(item, searchResultByRow, column)
                );
                const containsActiveSearchResult = searchResultsByCell
                  ? searchResultsByCell.some((item2) => item2.active)
                  : false;
                InlineValue($$renderer3, {
                  path,
                  value,
                  parser,
                  isSelected,
                  containsSearchResult: !isEmpty(searchResultsByCell),
                  containsActiveSearchResult,
                  onEdit: openJSONEditorModal
                });
              } else {
                $$renderer3.push('<!--[!-->');
                const searchResultItemsByCell = getInRecursiveState(
                  json,
                  searchResults,
                  path
                )?.searchResults;
                JSONValue($$renderer3, {
                  path,
                  value: value !== void 0 ? value : '',
                  enforceString: getEnforceString(json, documentState, path),
                  selection: isSelected ? selection : void 0,
                  searchResultItems: searchResultItemsByCell,
                  context
                });
              }
              $$renderer3.push(`<!--]-->`);
              if (!readOnly && isSelected && !isEditingSelection(selection)) {
                $$renderer3.push('<!--[-->');
                $$renderer3.push(`<div class="jse-context-menu-anchor svelte-m90oz6">`);
                ContextMenuPointer($$renderer3, { selected: true, onContextMenu: openContextMenu });
                $$renderer3.push(`<!----></div>`);
              } else {
                $$renderer3.push('<!--[!-->');
              }
              $$renderer3.push(`<!--]--></div> `);
              if (validationError2) {
                $$renderer3.push('<!--[-->');
                ValidationErrorIcon($$renderer3, {
                  validationError: validationError2,
                  onExpand: noop
                });
              } else {
                $$renderer3.push('<!--[!-->');
              }
              $$renderer3.push(`<!--]--></td>`);
            }
            $$renderer3.push(`<!--]-->`);
            if (showRefreshButton) {
              $$renderer3.push('<!--[-->');
              $$renderer3.push(`<td class="jse-table-cell svelte-m90oz6"></td>`);
            } else {
              $$renderer3.push('<!--[!-->');
            }
            $$renderer3.push(`<!--]--></tr>`);
          }
          $$renderer3.push(
            `<!--]--><tr class="jse-table-invisible-end-section svelte-m90oz6"><td${attr('colspan', columns.length)} class="svelte-m90oz6"${attr_style('', { height: visibleSection.endHeight + 'px' })}></td></tr></tbody></table></div> `
          );
          if (pastedJson) {
            $$renderer3.push('<!--[-->');
            Message($$renderer3, {
              type: 'info',
              message: `You pasted a JSON ${Array.isArray(pastedJson.contents) ? 'array' : 'object'} as text`,
              actions: [
                {
                  icon: faWrench,
                  text: 'Paste as JSON instead',
                  title: 'Paste the text as JSON instead of a single value',
                  onMouseDown: handleParsePastedJson
                },
                {
                  text: 'Leave as is',
                  title: 'Keep the pasted content as a single value',
                  onClick: handleClearPastedJson
                }
              ]
            });
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> `);
          if (pastedMultilineText) {
            $$renderer3.push('<!--[-->');
            Message($$renderer3, {
              type: 'info',
              message: 'Multiline text was pasted as array',
              actions: [
                {
                  icon: faWrench,
                  text: 'Paste as string instead',
                  title: 'Paste the clipboard data as a single string value instead of an array',
                  onClick: handleParsePastedMultilineText
                },
                {
                  text: 'Leave as is',
                  title: 'Keep the pasted array',
                  onClick: handleClearPastedMultilineText
                }
              ]
            });
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> `);
          if (textIsRepaired) {
            $$renderer3.push('<!--[-->');
            Message($$renderer3, {
              type: 'success',
              message: 'The loaded JSON document was invalid but is successfully repaired.',
              actions: !readOnly
                ? [
                    {
                      icon: faCheck,
                      text: 'Ok',
                      title: 'Accept the repaired document',
                      onClick: acceptAutoRepair
                    },
                    {
                      icon: faCode,
                      text: 'Repair manually instead',
                      title: 'Leave the document unchanged and repair it manually instead',
                      onClick: handleRequestRepair
                    }
                  ]
                : [],
              onClose: focus
            });
          } else {
            $$renderer3.push('<!--[!-->');
          }
          $$renderer3.push(`<!--]--> `);
          ValidationErrorsOverview($$renderer3, {
            validationErrors,
            selectError: handleSelectValidationError
          });
          $$renderer3.push(`<!---->`);
        } else {
          $$renderer3.push('<!--[!-->');
          if (parseError && text !== void 0 && text !== '') {
            $$renderer3.push('<!--[-->');
            Message($$renderer3, {
              type: 'error',
              message:
                'The loaded JSON document is invalid and could not be repaired automatically.',
              actions: !readOnly
                ? [
                    {
                      icon: faCode,
                      text: 'Repair manually',
                      title: 'Open the document in "code" mode and repair it manually',
                      onClick: handleRequestRepair
                    }
                  ]
                : []
            });
            $$renderer3.push(`<!----> `);
            JSONPreview($$renderer3, { text, json, indentation, parser });
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push('<!--[!-->');
            TableModeWelcome($$renderer3, {
              text,
              json,
              readOnly,
              parser
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push('<!--[!-->');
        $$renderer3.push(
          `<div class="jse-contents jse-contents-loading svelte-m90oz6"><div class="jse-loading-space svelte-m90oz6"></div> <div class="jse-loading svelte-m90oz6">loading...</div></div>`
        );
      }
      $$renderer3.push(`<!--]--></div> `);
      if (copyPasteModalOpen) {
        $$renderer3.push('<!--[-->');
        CopyPasteModal($$renderer3, { onClose: () => (copyPasteModalOpen = false) });
      } else {
        $$renderer3.push('<!--[!-->');
      }
      $$renderer3.push(`<!--]--> `);
      if (jsonRepairModalProps) {
        $$renderer3.push('<!--[-->');
        JSONRepairModal(
          $$renderer3,
          spread_props([
            jsonRepairModalProps,
            {
              onClose: () => {
                jsonRepairModalProps?.onClose();
                jsonRepairModalProps = void 0;
              }
            }
          ])
        );
      } else {
        $$renderer3.push('<!--[!-->');
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      readOnly,
      externalContent,
      externalSelection,
      history,
      truncateTextSize,
      mainMenuBar,
      escapeControlCharacters,
      escapeUnicodeCharacters,
      flattenColumns,
      parser,
      parseMemoizeOne,
      validator,
      validationParser,
      indentation,
      onChange,
      onChangeMode,
      onSelect,
      onUndo,
      onRedo,
      onRenderValue,
      onRenderMenu,
      onRenderContextMenu,
      onFocus,
      onBlur,
      onSortModal,
      onTransformModal,
      onJSONEditorModal,
      validate,
      patch,
      focus,
      acceptAutoRepair,
      scrollTo,
      findElement,
      openTransformModal
    });
  });
}
function JSONEditorRoot($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let content = $$props['content'];
    let selection = $$props['selection'];
    let readOnly = $$props['readOnly'];
    let indentation = $$props['indentation'];
    let tabSize = $$props['tabSize'];
    let truncateTextSize = $$props['truncateTextSize'];
    let externalMode = $$props['externalMode'];
    let mainMenuBar = $$props['mainMenuBar'];
    let navigationBar = $$props['navigationBar'];
    let statusBar = $$props['statusBar'];
    let askToFormat = $$props['askToFormat'];
    let escapeControlCharacters = $$props['escapeControlCharacters'];
    let escapeUnicodeCharacters = $$props['escapeUnicodeCharacters'];
    let flattenColumns = $$props['flattenColumns'];
    let parser = $$props['parser'];
    let parseMemoizeOne = $$props['parseMemoizeOne'];
    let validator = $$props['validator'];
    let validationParser = $$props['validationParser'];
    let pathParser = $$props['pathParser'];
    let insideModal = $$props['insideModal'];
    let onChange = $$props['onChange'];
    let onChangeMode = $$props['onChangeMode'];
    let onSelect = $$props['onSelect'];
    let onRenderValue = $$props['onRenderValue'];
    let onClassName = $$props['onClassName'];
    let onRenderMenu = $$props['onRenderMenu'];
    let onRenderContextMenu = $$props['onRenderContextMenu'];
    let onError = $$props['onError'];
    let onFocus = $$props['onFocus'];
    let onBlur = $$props['onBlur'];
    let onSortModal = $$props['onSortModal'];
    let onTransformModal = $$props['onTransformModal'];
    let onJSONEditorModal = $$props['onJSONEditorModal'];
    let refTextMode;
    const debug2 = createDebug('jsoneditor:JSONEditorRoot');
    const historyInstance = createHistoryInstance({
      onChange: (updatedHistory) => (history = updatedHistory)
    });
    let history = historyInstance.get();
    let mode = externalMode;
    function applyExternalMode(externalMode2) {
      if (externalMode2 === mode) {
        return;
      }
      const item = {
        type: 'mode',
        undo: { mode, selection: void 0 },
        redo: { mode: externalMode2, selection: void 0 }
      };
      if (mode === 'text' && refTextMode) {
        refTextMode.flush();
      }
      debug2('add history item', item);
      history.add(item);
      mode = externalMode2;
    }
    function handleUndo(item) {
      if (isModeHistoryItem(item)) {
        mode = item.undo.mode;
        const items = history.items();
        const index = items.findIndex((i) => i === item);
        const prevItem = index !== -1 ? items[index - 1] : void 0;
        debug2('handleUndo', { index, item, items, prevItem });
        if (prevItem) {
          selection = prevItem.redo.selection;
        }
        onChangeMode(mode);
      }
    }
    function handleRedo(item) {
      if (isModeHistoryItem(item)) {
        mode = item.redo.mode;
        const items = history.items();
        const index = items.findIndex((i) => i === item);
        const nextItem = index !== -1 ? items[index + 1] : void 0;
        debug2('handleRedo', { index, item, items, nextItem });
        if (nextItem) {
          selection = nextItem.undo.selection;
        }
        onChangeMode(mode);
      }
    }
    let modeMenuItems;
    const separatorMenuItem = { type: 'separator' };
    let handleRenderMenu;
    let handleRenderContextMenu;
    function patch(operations) {
      throw new Error(`Method patch is not available in mode "${mode}"`);
    }
    function expand(path, callback) {
      {
        throw new Error(`Method expand is not available in mode "${mode}"`);
      }
    }
    function collapse(path, recursive) {
      {
        throw new Error(`Method collapse is not available in mode "${mode}"`);
      }
    }
    function transform(options) {
      {
        throw new Error(`Method transform is not available in mode "${mode}"`);
      }
    }
    function validate() {
      {
        throw new Error(`Method validate is not available in mode "${mode}"`);
      }
    }
    function acceptAutoRepair() {
      {
        return content;
      }
    }
    function scrollTo(path) {
      {
        throw new Error(`Method scrollTo is not available in mode "${mode}"`);
      }
    }
    function findElement(path) {
      {
        throw new Error(`Method findElement is not available in mode "${mode}"`);
      }
    }
    function focus() {}
    async function refresh() {}
    applyExternalMode(externalMode);
    modeMenuItems = [
      {
        type: 'button',
        text: 'text',
        title: `Switch to text mode (current mode: ${mode})`,
        className: 'jse-group-button jse-first' + (mode === Mode.text ? ' jse-selected' : ''),
        onClick: () => onChangeMode(Mode.text)
      },
      {
        type: 'button',
        text: 'tree',
        title: `Switch to tree mode (current mode: ${mode})`,
        className: 'jse-group-button ' + (mode === Mode.tree ? ' jse-selected' : ''),
        onClick: () => onChangeMode(Mode.tree)
      },
      {
        type: 'button',
        text: 'table',
        title: `Switch to table mode (current mode: ${mode})`,
        className: 'jse-group-button jse-last' + (mode === Mode.table ? ' jse-selected' : ''),
        onClick: () => onChangeMode(Mode.table)
      }
    ];
    handleRenderMenu = (items) => {
      const updatedItems = isMenuSpace(items[0])
        ? modeMenuItems.concat(items)
        : // menu is empty, readOnly mode
          modeMenuItems.concat(separatorMenuItem, items);
      const updatedItemsOriginal = cloneDeep(updatedItems);
      return (
        onRenderMenu(updatedItems, { mode, modal: insideModal, readOnly }) || updatedItemsOriginal
      );
    };
    handleRenderContextMenu = (items) => {
      const itemsOriginal = cloneDeep(items);
      return (
        onRenderContextMenu(items, { mode, modal: insideModal, readOnly, selection }) ??
        (readOnly ? false : itemsOriginal)
      );
    };
    if (
      // Note that tree mode has an optional afterPatch callback.
      // right now we don's support this in the public API.
      // Note that tree mode has an optional afterPatch callback.
      // right now we don's support this in the public API.
      /**
       * Open the transform modal
       */
      /**
       * Validate the contents of the editor using the configured validator.
       * Returns a parse error or a list with validation warnings
       */
      /**
       * In tree mode, invalid JSON is automatically repaired when loaded. When the
       * repair was successful, the repaired contents are rendered but not yet
       * applied to the document itself until the user clicks "Ok" or starts editing
       * the data. Instead of accepting the repair, the user can also click
       * "Repair manually instead". Invoking `.acceptAutoRepair()` will
       * programmatically accept the repair. This will trigger an update,
       * and the method itself also returns the updated contents. In case of text
       * mode or when the editor is not in an "accept auto repair" status, nothing
       * will happen, and the contents will be returned as is.
       */
      // TODO: implement scrollTo for text mode
      // nothing to do in tree or table mode (also: don't throw an exception or so,
      // that annoying having to reckon with that when using .refresh()).
      mode === Mode.text ||
      String(mode) === 'code'
    ) {
      $$renderer2.push('<!--[-->');
      TextMode($$renderer2, {
        externalContent: content,
        externalSelection: selection,
        history,
        readOnly,
        indentation,
        tabSize,
        mainMenuBar,
        statusBar,
        askToFormat,
        escapeUnicodeCharacters,
        parser,
        validator,
        validationParser,
        onChange,
        onChangeMode,
        onSelect,
        onUndo: handleUndo,
        onRedo: handleRedo,
        onError,
        onFocus,
        onBlur,
        onRenderMenu: handleRenderMenu,
        onSortModal,
        onTransformModal
      });
    } else {
      $$renderer2.push('<!--[!-->');
      if (mode === Mode.table) {
        $$renderer2.push('<!--[-->');
        TableMode($$renderer2, {
          externalContent: content,
          externalSelection: selection,
          history,
          readOnly,
          truncateTextSize,
          mainMenuBar,
          escapeControlCharacters,
          escapeUnicodeCharacters,
          flattenColumns,
          parser,
          parseMemoizeOne,
          validator,
          validationParser,
          indentation,
          onChange,
          onChangeMode,
          onSelect,
          onUndo: handleUndo,
          onRedo: handleRedo,
          onRenderValue,
          onFocus,
          onBlur,
          onRenderMenu: handleRenderMenu,
          onRenderContextMenu: handleRenderContextMenu,
          onSortModal,
          onTransformModal,
          onJSONEditorModal
        });
      } else {
        $$renderer2.push('<!--[!-->');
        TreeMode($$renderer2, {
          externalContent: content,
          externalSelection: selection,
          history,
          readOnly,
          indentation,
          truncateTextSize,
          mainMenuBar,
          navigationBar,
          escapeControlCharacters,
          escapeUnicodeCharacters,
          parser,
          parseMemoizeOne,
          validator,
          validationParser,
          pathParser,
          onError,
          onChange,
          onChangeMode,
          onSelect,
          onUndo: handleUndo,
          onRedo: handleRedo,
          onRenderValue,
          onClassName,
          onFocus,
          onBlur,
          onRenderMenu: handleRenderMenu,
          onRenderContextMenu: handleRenderContextMenu,
          onSortModal,
          onTransformModal,
          onJSONEditorModal
        });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      content,
      selection,
      readOnly,
      indentation,
      tabSize,
      truncateTextSize,
      externalMode,
      mainMenuBar,
      navigationBar,
      statusBar,
      askToFormat,
      escapeControlCharacters,
      escapeUnicodeCharacters,
      flattenColumns,
      parser,
      parseMemoizeOne,
      validator,
      validationParser,
      pathParser,
      insideModal,
      onChange,
      onChangeMode,
      onSelect,
      onRenderValue,
      onClassName,
      onRenderMenu,
      onRenderContextMenu,
      onError,
      onFocus,
      onBlur,
      onSortModal,
      onTransformModal,
      onJSONEditorModal,
      patch,
      expand,
      collapse,
      transform,
      validate,
      acceptAutoRepair,
      scrollTo,
      findElement,
      focus,
      refresh
    });
  });
}
function JSONEditorModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentState, absolutePath, pathDescription, parseMemoizeOne;
    const debug2 = createDebug('jsoneditor:JSONEditorModal');
    let content = $$props['content'];
    let path = $$props['path'];
    let onPatch = $$props['onPatch'];
    let readOnly = $$props['readOnly'];
    let indentation = $$props['indentation'];
    let tabSize = $$props['tabSize'];
    let truncateTextSize = $$props['truncateTextSize'];
    let mainMenuBar = $$props['mainMenuBar'];
    let navigationBar = $$props['navigationBar'];
    let statusBar = $$props['statusBar'];
    let askToFormat = $$props['askToFormat'];
    let escapeControlCharacters = $$props['escapeControlCharacters'];
    let escapeUnicodeCharacters = $$props['escapeUnicodeCharacters'];
    let flattenColumns = $$props['flattenColumns'];
    let parser = $$props['parser'];
    let validator = $$props['validator'];
    let validationParser = $$props['validationParser'];
    let pathParser = $$props['pathParser'];
    let onRenderValue = $$props['onRenderValue'];
    let onClassName = $$props['onClassName'];
    let onRenderMenu = $$props['onRenderMenu'];
    let onRenderContextMenu = $$props['onRenderContextMenu'];
    let onSortModal = $$props['onSortModal'];
    let onTransformModal = $$props['onTransformModal'];
    let onClose = $$props['onClose'];
    let refEditor;
    let fullscreen;
    const rootState = {
      mode: determineMode(content),
      content,
      selection: void 0,
      relativePath: path
    };
    let stack = [rootState];
    let error = void 0;
    function determineMode(content2) {
      return isJSONContent(content2) && isJSONArray(content2.json) ? Mode.table : Mode.tree;
    }
    function scrollToSelection() {
      const selection = last(stack)?.selection;
      if (isJSONSelection(selection)) {
        refEditor.scrollTo(getFocusPath(selection));
      }
    }
    function handleClose() {
      debug2('handleClose');
      if (fullscreen) {
        fullscreen = false;
      } else if (stack.length > 1) {
        stack = initial(stack);
        scrollToSelection();
        error = void 0;
      } else {
        onClose();
      }
    }
    function handleChange(updatedContent) {
      debug2('handleChange', updatedContent);
      updateState((state) => ({ ...state, content: updatedContent }));
    }
    function handleChangeSelection(newSelection) {
      debug2('handleChangeSelection', newSelection);
      updateState((state) => ({ ...state, selection: newSelection }));
    }
    function handleChangeMode(newMode) {
      debug2('handleChangeMode', newMode);
      updateState((state) => ({ ...state, mode: newMode }));
    }
    function updateState(callback) {
      const state = last(stack);
      const updatedState = callback(state);
      stack = [...initial(stack), updatedState];
    }
    function handleError(newError) {
      error = newError.toString();
      console.error(newError);
    }
    function handleJSONEditorModal({ content: content2, path: path2 }) {
      debug2('handleJSONEditorModal', { content: content2, path: path2 });
      const nestedModalState = {
        mode: determineMode(content2),
        content: content2,
        selection: void 0,
        relativePath: path2
      };
      stack = [...stack, nestedModalState];
    }
    currentState = last(stack) || rootState;
    absolutePath = stack.flatMap((state) => state.relativePath);
    pathDescription = !isEmpty(absolutePath) ? stringifyJSONPath(absolutePath) : '(document root)';
    parseMemoizeOne = memoizeOne(parser.parse);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Modal($$renderer3, {
        onClose: handleClose,
        className: 'jse-jsoneditor-modal',
        fullscreen,
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="jse-modal-wrapper svelte-1hvu55v">`);
          AbsolutePopup($$renderer4, {
            children: ($$renderer5) => {
              Header($$renderer5, {
                title: `Edit nested content ${stringify$1(stack.length > 1 ? ` (${stack.length})` : '')}`,
                fullScreenButton: true,
                onClose: handleClose,
                get fullscreen() {
                  return fullscreen;
                },
                set fullscreen($$value) {
                  fullscreen = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(
                `<!----> <div class="jse-modal-contents svelte-1hvu55v"><div class="jse-label svelte-1hvu55v"><div class="jse-label-inner svelte-1hvu55v">Path</div></div> <input class="jse-path svelte-1hvu55v" type="text" readonly title="Selected path"${attr('value', pathDescription)}/> <div class="jse-label svelte-1hvu55v"><div class="jse-label-inner svelte-1hvu55v">Contents</div></div> <div class="jse-modal-inline-editor svelte-1hvu55v">`
              );
              JSONEditorRoot($$renderer5, {
                externalMode: currentState.mode,
                content: currentState.content,
                selection: currentState.selection,
                readOnly,
                indentation,
                tabSize,
                truncateTextSize,
                statusBar,
                askToFormat,
                mainMenuBar,
                navigationBar,
                escapeControlCharacters,
                escapeUnicodeCharacters,
                flattenColumns,
                parser,
                parseMemoizeOne,
                validator,
                validationParser,
                pathParser,
                insideModal: true,
                onError: handleError,
                onChange: handleChange,
                onChangeMode: handleChangeMode,
                onSelect: handleChangeSelection,
                onRenderValue,
                onClassName,
                onFocus: noop,
                onBlur: noop,
                onRenderMenu,
                onRenderContextMenu,
                onSortModal,
                onTransformModal,
                onJSONEditorModal: handleJSONEditorModal
              });
              $$renderer5.push(`<!----></div> <div class="jse-actions svelte-1hvu55v">`);
              if (error) {
                $$renderer5.push('<!--[-->');
                $$renderer5.push(
                  `<div class="jse-error svelte-1hvu55v">${escape_html(error)}</div>`
                );
              } else {
                $$renderer5.push('<!--[!-->');
              }
              $$renderer5.push(`<!--]--> `);
              if (stack.length > 1) {
                $$renderer5.push('<!--[-->');
                $$renderer5.push(`<button type="button" class="jse-secondary svelte-1hvu55v">`);
                Icon($$renderer5, { data: faCaretLeft });
                $$renderer5.push(`<!----> Back</button>`);
              } else {
                $$renderer5.push('<!--[!-->');
              }
              $$renderer5.push(`<!--]--> `);
              if (!readOnly) {
                $$renderer5.push('<!--[-->');
                $$renderer5.push(
                  `<button type="button" class="jse-primary svelte-1hvu55v">Apply</button>`
                );
              } else {
                $$renderer5.push('<!--[!-->');
                $$renderer5.push(
                  `<button type="button" class="jse-primary svelte-1hvu55v">Close</button>`
                );
              }
              $$renderer5.push(`<!--]--></div></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----></div>`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      content,
      path,
      onPatch,
      readOnly,
      indentation,
      tabSize,
      truncateTextSize,
      mainMenuBar,
      navigationBar,
      statusBar,
      askToFormat,
      escapeControlCharacters,
      escapeUnicodeCharacters,
      flattenColumns,
      parser,
      validator,
      validationParser,
      pathParser,
      onRenderValue,
      onClassName,
      onRenderMenu,
      onRenderContextMenu,
      onSortModal,
      onTransformModal,
      onClose
    });
  });
}
const sortModalStates = {};
function SortModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let selectedJson, jsonIsArray, paths, properties;
    const debug2 = createDebug('jsoneditor:SortModal');
    let id2 = $$props['id'];
    let json = $$props['json'];
    let rootPath = $$props['rootPath'];
    let onSort = $$props['onSort'];
    let onClose = $$props['onClose'];
    const asc = { value: 1, label: 'ascending' };
    const desc = { value: -1, label: 'descending' };
    const directions = [asc, desc];
    const stateId = `${id2}:${compileJSONPointer(rootPath)}`;
    let selectedProperty = sortModalStates[stateId]?.selectedProperty;
    let selectedDirection = sortModalStates[stateId]?.selectedDirection || asc;
    selectedJson = getIn(json, rootPath);
    jsonIsArray = Array.isArray(selectedJson);
    paths = jsonIsArray ? getNestedPaths(selectedJson) : void 0;
    properties = paths ? paths.map(pathToOption) : void 0;
    {
      sortModalStates[stateId] = { selectedProperty, selectedDirection };
      debug2('store state in memory', stateId, sortModalStates[stateId]);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Modal($$renderer3, {
        onClose,
        className: 'jse-sort-modal',
        children: ($$renderer4) => {
          Header($$renderer4, {
            title: jsonIsArray ? 'Sort array items' : 'Sort object keys',
            onClose
          });
          $$renderer4.push(
            `<!----> <div class="jse-modal-contents svelte-bng95m"><table class="svelte-bng95m"><colgroup><col width="25%"/><col width="75%"/></colgroup><tbody><tr><th class="svelte-bng95m">Path</th><td class="svelte-bng95m"><input class="jse-path svelte-bng95m" type="text" readonly title="Selected path"${attr('value', rootPath && !isEmpty(rootPath) ? stringifyJSONPath(rootPath) : '(document root)')}/></td></tr>`
          );
          if (jsonIsArray && properties && properties?.length > 1) {
            $$renderer4.push('<!--[-->');
            $$renderer4.push(
              `<tr><th class="svelte-bng95m">Property</th><td class="svelte-bng95m">`
            );
            Select($$renderer4, {
              showChevron: true,
              items: properties,
              get value() {
                return selectedProperty;
              },
              set value($$value) {
                selectedProperty = $$value;
                $$settled = false;
              }
            });
            $$renderer4.push(`<!----></td></tr>`);
          } else {
            $$renderer4.push('<!--[!-->');
          }
          $$renderer4.push(
            `<!--]--><tr><th class="svelte-bng95m">Direction</th><td class="svelte-bng95m">`
          );
          Select($$renderer4, {
            showChevron: true,
            clearable: false,
            items: directions,
            get value() {
              return selectedDirection;
            },
            set value($$value) {
              selectedDirection = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(
            `<!----></td></tr></tbody></table> <div class="jse-space svelte-bng95m">`
          );
          {
            $$renderer4.push('<!--[!-->');
          }
          $$renderer4.push(
            `<!--]--></div> <div class="jse-actions svelte-bng95m"><button type="button" class="jse-primary svelte-bng95m"${attr('disabled', jsonIsArray && properties && properties?.length > 1 ? !selectedProperty : false, true)}>Sort</button></div></div>`
          );
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { id: id2, json, rootPath, onSort, onClose });
  });
}
function JSONEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let parseMemoizeOne;
    const debug2 = createDebug('jsoneditor:JSONEditor');
    const contentDefault = { text: '' };
    const selectionDefault = void 0;
    const readOnlyDefault = false;
    const indentationDefault = 2;
    const tabSizeDefault = 4;
    const truncateTextSizeDefault = 1e3;
    const modeDefault = Mode.tree;
    const mainMenuBarDefault = true;
    const navigationBarDefault = true;
    const statusBarDefault = true;
    const askToFormatDefault = true;
    const escapeControlCharactersDefault = false;
    const escapeUnicodeCharactersDefault = false;
    const flattenColumnsDefault = true;
    const parserDefault = JSON;
    const validatorDefault = void 0;
    const validationParserDefault = JSON;
    const pathParserDefault = { parse: parseJSONPath, stringify: stringifyJSONPath };
    const queryLanguagesDefault = [jsonQueryLanguage];
    const queryLanguageIdDefault = queryLanguagesDefault[0].id;
    const onChangeQueryLanguageDefault = noop;
    const onChangeDefault = void 0;
    const onSelectDefault = void 0;
    const onRenderValueDefault = renderValue;
    const onClassNameDefault = noop;
    const onRenderMenuDefault = noop;
    const onRenderContextMenuDefault = noop;
    const onChangeModeDefault = noop;
    const onErrorDefault = (err) => {
      console.error(err);
      alert(err.toString());
    };
    const onFocusDefault = noop;
    const onBlurDefault = noop;
    let content = fallback($$props['content'], contentDefault);
    let selection = fallback($$props['selection'], selectionDefault);
    let readOnly = fallback($$props['readOnly'], readOnlyDefault);
    let indentation = fallback($$props['indentation'], indentationDefault);
    let tabSize = fallback($$props['tabSize'], tabSizeDefault);
    let truncateTextSize = fallback($$props['truncateTextSize'], truncateTextSizeDefault);
    let mode = fallback($$props['mode'], modeDefault);
    let mainMenuBar = fallback($$props['mainMenuBar'], mainMenuBarDefault);
    let navigationBar = fallback($$props['navigationBar'], navigationBarDefault);
    let statusBar = fallback($$props['statusBar'], statusBarDefault);
    let askToFormat = fallback($$props['askToFormat'], askToFormatDefault);
    let escapeControlCharacters = fallback(
      $$props['escapeControlCharacters'],
      escapeControlCharactersDefault
    );
    let escapeUnicodeCharacters = fallback(
      $$props['escapeUnicodeCharacters'],
      escapeUnicodeCharactersDefault
    );
    let flattenColumns = fallback($$props['flattenColumns'], flattenColumnsDefault);
    let parser = fallback($$props['parser'], parserDefault);
    let validator = fallback($$props['validator'], validatorDefault);
    let validationParser = fallback($$props['validationParser'], validationParserDefault);
    let pathParser = fallback($$props['pathParser'], pathParserDefault);
    let queryLanguages = fallback($$props['queryLanguages'], queryLanguagesDefault);
    let queryLanguageId = fallback($$props['queryLanguageId'], queryLanguageIdDefault);
    let onChangeQueryLanguage = fallback(
      $$props['onChangeQueryLanguage'],
      onChangeQueryLanguageDefault
    );
    let onChange = fallback($$props['onChange'], onChangeDefault);
    let onSelect = fallback($$props['onSelect'], onSelectDefault);
    let onRenderValue = fallback($$props['onRenderValue'], onRenderValueDefault);
    let onClassName = fallback($$props['onClassName'], onClassNameDefault);
    let onRenderMenu = fallback($$props['onRenderMenu'], onRenderMenuDefault);
    let onRenderContextMenu = fallback($$props['onRenderContextMenu'], onRenderContextMenuDefault);
    let onChangeMode = fallback($$props['onChangeMode'], onChangeModeDefault);
    let onError = fallback($$props['onError'], onErrorDefault);
    let onFocus = fallback($$props['onFocus'], onFocusDefault);
    let onBlur = fallback($$props['onBlur'], onBlurDefault);
    uniqueId();
    let hasFocus = false;
    let refJSONEditorRoot;
    let jsonEditorModalProps = void 0;
    let sortModalProps;
    let transformModalProps;
    let previousParser = parser;
    function get() {
      return content;
    }
    function set(newContent) {
      debug2('set');
      const contentError = validateContentType(newContent);
      if (contentError) {
        throw new Error(contentError);
      }
      uniqueId();
      content = newContent;
    }
    function update(updatedContent) {
      debug2('update');
      const contentError = validateContentType(updatedContent);
      if (contentError) {
        throw new Error(contentError);
      }
      content = updatedContent;
    }
    function patch(operations) {
      const result = refJSONEditorRoot.patch(operations);
      return result;
    }
    function select(newSelection) {
      selection = newSelection;
    }
    function expand(path, callback) {
      refJSONEditorRoot.expand(path, callback);
    }
    function collapse(path, recursive = false) {
      refJSONEditorRoot.collapse(path, recursive);
    }
    function transform(options = {}) {
      refJSONEditorRoot.transform(options);
    }
    function validate() {
      return refJSONEditorRoot.validate();
    }
    function acceptAutoRepair() {
      const content2 = refJSONEditorRoot.acceptAutoRepair();
      return content2;
    }
    async function scrollTo(path) {
      await refJSONEditorRoot.scrollTo(path);
    }
    function findElement(path) {
      return refJSONEditorRoot.findElement(path);
    }
    function focus() {
      refJSONEditorRoot.focus();
    }
    async function refresh() {
      await refJSONEditorRoot.refresh();
    }
    function updateProps(props) {
      const names = Object.keys(props);
      for (const name of names) {
        switch (name) {
          case 'content':
            content = props[name] ?? contentDefault;
            break;
          case 'selection':
            selection = props[name] ?? selectionDefault;
            break;
          case 'readOnly':
            readOnly = props[name] ?? readOnlyDefault;
            break;
          case 'indentation':
            indentation = props[name] ?? indentationDefault;
            break;
          case 'tabSize':
            tabSize = props[name] ?? tabSizeDefault;
            break;
          case 'truncateTextSize':
            truncateTextSize = props[name] ?? truncateTextSizeDefault;
            break;
          case 'mode':
            mode = props[name] ?? modeDefault;
            break;
          case 'mainMenuBar':
            mainMenuBar = props[name] ?? mainMenuBarDefault;
            break;
          case 'navigationBar':
            navigationBar = props[name] ?? navigationBarDefault;
            break;
          case 'statusBar':
            statusBar = props[name] ?? statusBarDefault;
            break;
          case 'askToFormat':
            askToFormat = props[name] ?? askToFormatDefault;
            break;
          case 'escapeControlCharacters':
            escapeControlCharacters = props[name] ?? escapeControlCharactersDefault;
            break;
          case 'escapeUnicodeCharacters':
            escapeUnicodeCharacters = props[name] ?? escapeUnicodeCharactersDefault;
            break;
          case 'flattenColumns':
            flattenColumns = props[name] ?? flattenColumnsDefault;
            break;
          case 'parser':
            parser = props[name] ?? parserDefault;
            break;
          case 'validator':
            validator = props[name] ?? validatorDefault;
            break;
          case 'validationParser':
            validationParser = props[name] ?? validationParserDefault;
            break;
          case 'pathParser':
            pathParser = props[name] ?? pathParserDefault;
            break;
          case 'queryLanguages':
            queryLanguages = props[name] ?? queryLanguagesDefault;
            break;
          case 'queryLanguageId':
            queryLanguageId = props[name] ?? queryLanguageIdDefault;
            break;
          case 'onChangeQueryLanguage':
            onChangeQueryLanguage = props[name] ?? onChangeQueryLanguageDefault;
            break;
          case 'onChange':
            onChange = props[name] ?? onChangeDefault;
            break;
          case 'onRenderValue':
            onRenderValue = props[name] ?? onRenderValueDefault;
            break;
          case 'onClassName':
            onClassName = props[name] ?? onClassNameDefault;
            break;
          case 'onRenderMenu':
            onRenderMenu = props[name] ?? onRenderMenuDefault;
            break;
          case 'onRenderContextMenu':
            onRenderContextMenu = props[name] ?? onRenderContextMenuDefault;
            break;
          case 'onChangeMode':
            onChangeMode = props[name] ?? onChangeModeDefault;
            break;
          case 'onSelect':
            onSelect = props[name] ?? onSelectDefault;
            break;
          case 'onError':
            onError = props[name] ?? onErrorDefault;
            break;
          case 'onFocus':
            onFocus = props[name] ?? onFocusDefault;
            break;
          case 'onBlur':
            onBlur = props[name] ?? onBlurDefault;
            break;
          default:
            unknownProperty(name);
        }
      }
      if (!queryLanguages.some((queryLanguage) => queryLanguage.id === queryLanguageId)) {
        queryLanguageId = queryLanguages[0].id;
      }
      function unknownProperty(name) {
        debug2(`Unknown property "${name}"`);
      }
    }
    async function destroy() {
      throw new Error(
        'class method destroy() is deprecated. It is replaced with a method destroy() in the vanilla library.'
      );
    }
    function handleChange(updatedContent, previousContent, status) {
      content = updatedContent;
      if (onChange) {
        onChange(updatedContent, previousContent, status);
      }
    }
    function handleSelect(updatedSelection) {
      selection = updatedSelection;
      if (onSelect) {
        onSelect(cloneDeep(updatedSelection));
      }
    }
    function handleFocus() {
      hasFocus = true;
      if (onFocus) {
        onFocus();
      }
    }
    function handleBlur() {
      hasFocus = false;
      if (onBlur) {
        onBlur();
      }
    }
    async function toggleMode(newMode) {
      if (mode === newMode) {
        return;
      }
      mode = newMode;
      focus();
      onChangeMode(newMode);
    }
    function handleChangeQueryLanguage(newQueryLanguageId) {
      debug2('handleChangeQueryLanguage', newQueryLanguageId);
      queryLanguageId = newQueryLanguageId;
      onChangeQueryLanguage(newQueryLanguageId);
    }
    function onTransformModal({ id: id2, json, rootPath, onTransform, onClose }) {
      if (readOnly) {
        return;
      }
      transformModalProps = {
        id: id2,
        json,
        rootPath,
        indentation,
        truncateTextSize,
        escapeControlCharacters,
        escapeUnicodeCharacters,
        parser,
        parseMemoizeOne,
        validationParser,
        pathParser,
        queryLanguages,
        queryLanguageId,
        onChangeQueryLanguage: handleChangeQueryLanguage,
        onRenderValue,
        onRenderMenu: (items) => onRenderMenu(items, { mode, modal: true, readOnly }),
        onRenderContextMenu: (items) =>
          onRenderContextMenu(items, { mode, modal: true, readOnly, selection }),
        onClassName,
        onTransform,
        onClose
      };
    }
    function onSortModal(props) {
      if (readOnly) {
        return;
      }
      sortModalProps = props;
    }
    function onJSONEditorModal({ content: content2, path, onPatch, onClose }) {
      debug2('onJSONEditorModal', { content: content2, path });
      jsonEditorModalProps = {
        content: content2,
        path,
        onPatch,
        readOnly,
        indentation,
        tabSize,
        truncateTextSize,
        mainMenuBar,
        navigationBar,
        statusBar,
        askToFormat,
        escapeControlCharacters,
        escapeUnicodeCharacters,
        flattenColumns,
        parser,
        validator: void 0,
        // TODO: support partial JSON validation?
        validationParser,
        pathParser,
        onRenderValue,
        onClassName,
        onRenderMenu,
        onRenderContextMenu,
        onSortModal,
        onTransformModal,
        onClose
      };
    }
    {
      if (!isEqualParser(parser, previousParser)) {
        debug2('parser changed, recreate editor');
        if (isJSONContent(content)) {
          const text = previousParser.stringify(content.json);
          content = { json: text !== void 0 ? parser.parse(text) : void 0 };
        }
        previousParser = parser;
        uniqueId();
      }
    }
    {
      const contentError = validateContentType(content);
      if (contentError) {
        console.error('Error: ' + contentError);
      }
    }
    if (selection === null) {
      console.warn('selection is invalid: it is null but should be undefined');
    }
    parseMemoizeOne = memoizeOne(parser.parse);
    debug2('mode changed to', mode);
    AbsolutePopup($$renderer2, {
      children: ($$renderer3) => {
        $$renderer3.push(
          `<div${attr_class('jse-main svelte-1k65mul', void 0, { 'jse-focus': hasFocus })} role="none"><!---->`
        );
        {
          JSONEditorRoot($$renderer3, {
            externalMode: mode,
            content,
            selection,
            readOnly,
            indentation,
            tabSize,
            truncateTextSize,
            statusBar,
            askToFormat,
            mainMenuBar,
            navigationBar,
            escapeControlCharacters,
            escapeUnicodeCharacters,
            flattenColumns,
            parser,
            parseMemoizeOne,
            validator,
            validationParser,
            pathParser,
            insideModal: false,
            onError,
            onChange: handleChange,
            onChangeMode: toggleMode,
            onSelect: handleSelect,
            onRenderValue,
            onClassName,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onRenderMenu,
            onRenderContextMenu,
            onSortModal,
            onTransformModal,
            onJSONEditorModal
          });
        }
        $$renderer3.push(`<!----></div> `);
        if (sortModalProps) {
          $$renderer3.push('<!--[-->');
          SortModal(
            $$renderer3,
            spread_props([
              sortModalProps,
              {
                onClose: () => {
                  sortModalProps?.onClose();
                  sortModalProps = void 0;
                }
              }
            ])
          );
        } else {
          $$renderer3.push('<!--[!-->');
        }
        $$renderer3.push(`<!--]--> `);
        if (transformModalProps) {
          $$renderer3.push('<!--[-->');
          TransformModal(
            $$renderer3,
            spread_props([
              transformModalProps,
              {
                onClose: () => {
                  transformModalProps?.onClose();
                  transformModalProps = void 0;
                }
              }
            ])
          );
        } else {
          $$renderer3.push('<!--[!-->');
        }
        $$renderer3.push(`<!--]--> `);
        if (jsonEditorModalProps) {
          $$renderer3.push('<!--[-->');
          JSONEditorModal(
            $$renderer3,
            spread_props([
              jsonEditorModalProps,
              {
                onClose: () => {
                  jsonEditorModalProps?.onClose();
                  jsonEditorModalProps = void 0;
                }
              }
            ])
          );
        } else {
          $$renderer3.push('<!--[!-->');
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, {
      content,
      selection,
      readOnly,
      indentation,
      tabSize,
      truncateTextSize,
      mode,
      mainMenuBar,
      navigationBar,
      statusBar,
      askToFormat,
      escapeControlCharacters,
      escapeUnicodeCharacters,
      flattenColumns,
      parser,
      validator,
      validationParser,
      pathParser,
      queryLanguages,
      queryLanguageId,
      onChangeQueryLanguage,
      onChange,
      onSelect,
      onRenderValue,
      onClassName,
      onRenderMenu,
      onRenderContextMenu,
      onChangeMode,
      onError,
      onFocus,
      onBlur,
      get,
      set,
      update,
      patch,
      select,
      expand,
      collapse,
      transform,
      validate,
      acceptAutoRepair,
      scrollTo,
      findElement,
      focus,
      refresh,
      updateProps,
      destroy
    });
  });
}
const xmlParser = new XMLParser({
  isArray: (name) =>
    [
      'mur',
      'plancher_bas',
      'plancher_haut',
      'baie_vitree',
      'porte',
      'pont_thermique',
      'ventilation',
      'installation_ecs',
      'generateur_ecs',
      'climatisation',
      'installation_chauffage',
      'generateur_chauffage',
      'emetteur_chauffage',
      'sortie_par_energie'
    ].includes(name),
  tagValueProcessor: (tagName, val) => {
    if (tagName.startsWith('enum_')) {
      return null;
    }
    if (Number.isNaN(Number(val))) return val;
    return Number(val);
  }
});
class DpeXmlParserService {
  /**
   * @param xmlContent {string}
   */
  static convertFileToJson(xmlContent) {
    return xmlParser.parse(xmlContent).dpe;
  }
}
function JsonDiff($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let input = $$props['input'];
    let output = $$props['output'];
    $$renderer2.push(`<div id="visual-diff"></div>`);
    bind_props($$props, { input, output });
  });
}
function DpeAnalysis($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    set_tv_match_optimized_version();
    set_bug_for_bug_compat();
    let inputJsonEditor;
    let outputJsonEditor;
    let filesInDropzone = null;
    let inputDpeData = { text: '' };
    let inputDpe = (() => {
      return inputDpeData.text !== '' ? JSON.parse(inputDpeData.text) : {};
    })();
    let outputDpeData = { text: '' };
    let outputDpe = (() => {
      return outputDpeData.text !== '' ? JSON.parse(outputDpeData.text) : {};
    })();
    const handleXmlFile = (event) => {
      if (event.target && event.target.result) {
        inputDpeData = {
          text: JSON.stringify(
            DpeXmlParserService.convertFileToJson(event.target.result.toString()),
            null,
            2
          )
        };
        refreshOutputJsonEditor(inputDpeData);
      }
    };
    const loadFile = () => {
      let reader = new FileReader();
      reader.onload = handleXmlFile;
      reader.readAsText(filesInDropzone[0]);
    };
    function handleOnChange(event) {
      const target = event.target;
      filesInDropzone = target.files;
      loadFile();
    }
    function handleOnDrop(event) {
      event.preventDefault();
      filesInDropzone = event.dataTransfer?.files ?? null;
      loadFile();
    }
    const refreshOutputJsonEditor = (updatedContent) => {
      const jsonContent = JSON.parse(updatedContent.text);
      setAnalyzedDpe({ code: jsonContent.numero_dpe });
      outputDpeData = { text: JSON.stringify(calcul_3cl(jsonContent), null, 2) };
      beautifyJsonEditor(inputJsonEditor);
      beautifyJsonEditor(outputJsonEditor);
    };
    const beautifyJsonEditor = (jsonEditor) => {
      setTimeout(() => {
        jsonEditor.collapse([], true);
        setTimeout(() => {
          jsonEditor.expand(['administratif']);
        }, 100);
      }, 100);
    };
    const clearAnalyzedDpe = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      filesInDropzone = null;
    };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Accordion($$renderer3, {
        multiple: true,
        children: ($$renderer4) => {
          {
            let header = function ($$renderer5) {
              $$renderer5.push(`<div class="flex justify-center gap-5 items-center">`);
              if (inputDpe?.numero_dpe) {
                $$renderer5.push('<!--[-->');
                $$renderer5.push(`<div>Données dpe `);
                Badge($$renderer5, {
                  large: true,
                  color: 'green',
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(inputDpe?.numero_dpe)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div> `);
                Button($$renderer5, {
                  size: 'xs',
                  onclick: clearAnalyzedDpe,
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Analyser un autre DPE`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!---->`);
              } else {
                $$renderer5.push('<!--[!-->');
                $$renderer5.push(`Données dpe`);
              }
              $$renderer5.push(`<!--]--></div>`);
            };
            AccordionItem($$renderer4, {
              open: true,
              header,
              children: ($$renderer5) => {
                $$renderer5.push(`<div>`);
                if (filesInDropzone && filesInDropzone[0] && !inputDpe?.numero_dpe) {
                  $$renderer5.push('<!--[-->');
                  $$renderer5.push(`<div class="pb-3">`);
                  Spinner($$renderer5, { type: 'orbit', color: 'rose', size: 6 });
                  $$renderer5.push(
                    `<!----> <span class="text-sm">Analyse du dpe en cours...</span></div>`
                  );
                } else {
                  $$renderer5.push('<!--[!-->');
                }
                $$renderer5.push(`<!--]--> `);
                if (!(filesInDropzone && filesInDropzone[0])) {
                  $$renderer5.push('<!--[-->');
                  Dropzone($$renderer5, {
                    id: 'my-awesome-dropzone',
                    onChange: handleOnChange,
                    onDrop: handleOnDrop,
                    accept: '.xml',
                    get files() {
                      return filesInDropzone;
                    },
                    set files($$value) {
                      filesInDropzone = $$value;
                      $$settled = false;
                    },
                    children: ($$renderer6) => {
                      $$renderer6.push(
                        `<svg aria-hidden="true" class="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg> <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Cliquer pour charger un dpe à analyser</span> ou glisser / déposer.</p> <p class="text-xs text-gray-500 dark:text-gray-400">Format XML uniquement</p>`
                      );
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$renderer5.push('<!--[!-->');
                }
                $$renderer5.push(`<!--]--></div> <div class="grid gap-2 p-3 md:grid-cols-2"><div>`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Données d'entrée `);
                    Badge($$renderer6, {
                      color: 'pink',
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Entrée`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                JSONEditor($$renderer5, {
                  collapse: true,
                  mode: 'text',
                  mainMenuBar: false,
                  navigationBar: false,
                  content: inputDpeData,
                  onChange: refreshOutputJsonEditor
                });
                $$renderer5.push(`<!----></div> <div><div class="flex justify-between">`);
                Label($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Données de sortie du moteur Open 3CL `);
                    Badge($$renderer6, {
                      color: 'green',
                      children: ($$renderer7) => {
                        $$renderer7.push(`<!---->Sortie`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer6.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----></div> `);
                JSONEditor($$renderer5, {
                  collapse: true,
                  mode: 'text',
                  mainMenuBar: false,
                  navigationBar: false,
                  content: outputDpeData
                });
                $$renderer5.push(`<!----></div></div>`);
              },
              $$slots: { header: true, default: true }
            });
          }
          $$renderer4.push(`<!----> `);
          {
            let header = function ($$renderer5) {
              $$renderer5.push(`<div>Différences entrée / sortie dpe `);
              Badge($$renderer5, {
                large: true,
                color: 'green',
                children: ($$renderer6) => {
                  $$renderer6.push(`<!---->${escape_html(inputDpe?.numero_dpe)}`);
                },
                $$slots: { default: true }
              });
              $$renderer5.push(`<!----></div>`);
            };
            AccordionItem($$renderer4, {
              open: true,
              header,
              children: ($$renderer5) => {
                $$renderer5.push(`<div>`);
                JsonDiff($$renderer5, { input: inputDpe, output: outputDpe });
                $$renderer5.push(`<!----></div>`);
              },
              $$slots: { header: true, default: true }
            });
          }
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let menuSelected = 'analysis';
    function selectMenu(selected) {
      menuSelected = selected;
    }
    $$renderer2.push(`<div class="relative">`);
    Sidebar($$renderer2, {
      alwaysOpen: true,
      backdrop: false,
      params: { x: -50, duration: 50 },
      class: 'z-50 h-full',
      position: 'absolute',
      classes: { nonactive: 'p-2', active: 'p-2' },
      children: ($$renderer3) => {
        SidebarGroup($$renderer3, {
          children: ($$renderer4) => {
            {
              let subtext = function ($$renderer5) {
                Badge($$renderer5, {
                  color: 'green',
                  class: 'p-1 ml-2',
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(getAnalyzedDpe().code)}`);
                  },
                  $$slots: { default: true }
                });
              };
              SidebarItem($$renderer4, {
                active: menuSelected === 'analysis',
                onclick: () => selectMenu('analysis'),
                label: getAnalyzedDpe().code ? 'Dpe analysé' : 'Analyser un Dpe',
                subtext,
                $$slots: { subtext: true }
              });
            }
            $$renderer4.push(`<!----> `);
            SidebarItem($$renderer4, {
              active: menuSelected === 'reports',
              onclick: () => selectMenu('reports'),
              label: 'Rapports corpus'
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
      },
      $$slots: { default: true }
    });
    $$renderer2.push(
      `<!----></div> <div class="h-full overflow-auto px-4 md:ml-64 w-full"><div${attr_class(menuSelected !== 'analysis' ? 'hidden' : '')}>`
    );
    DpeAnalysis($$renderer2);
    $$renderer2.push(`<!----></div> `);
    if (menuSelected === 'reports') {
      $$renderer2.push('<!--[-->');
      $$renderer2.push(
        `<div${attr_class(menuSelected !== 'reports' ? 'hidden w-full' : 'w-full')}><iframe class="w-full h-250" src="http://localhost:8080"></iframe></div>`
      );
    } else {
      $$renderer2.push('<!--[!-->');
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export { _page as default };
