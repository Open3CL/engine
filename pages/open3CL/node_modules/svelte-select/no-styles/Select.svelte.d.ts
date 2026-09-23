/** @typedef {typeof __propDef.props}  SelectProps */
/** @typedef {typeof __propDef.events}  SelectEvents */
/** @typedef {typeof __propDef.slots}  SelectSlots */
export default class Select extends SvelteComponentTyped<{
    loading?: boolean;
    loadOptions?: any;
    filterText?: string;
    items?: any;
    multiple?: boolean;
    value?: any;
    itemId?: string;
    groupBy?: any;
    filterSelectedItems?: boolean;
    itemFilter?: (label: any, filterText: any, option: any) => boolean;
    label?: string;
    required?: boolean;
    id?: any;
    input?: any;
    filter?: typeof _filter;
    name?: any;
    justValue?: any;
    getItems?: typeof _getItems;
    container?: any;
    multiFullItemClearable?: boolean;
    disabled?: boolean;
    focused?: boolean;
    placeholder?: string;
    placeholderAlwaysShow?: boolean;
    groupFilter?: (groups: any) => any;
    groupHeaderSelectable?: boolean;
    containerStyles?: string;
    hasError?: boolean;
    closeListOnChange?: boolean;
    clearFilterTextOnBlur?: boolean;
    createGroupHeaderItem?: (groupValue: any, item: any) => {
        [x: string]: any;
        value: any;
    };
    getFilteredItems?: () => any;
    searchable?: boolean;
    inputStyles?: string;
    clearable?: boolean;
    listOpen?: boolean;
    debounce?: (fn: any, wait?: number) => void;
    debounceWait?: number;
    hideEmptyState?: boolean;
    inputAttributes?: {};
    listAutoWidth?: boolean;
    showChevron?: boolean;
    listOffset?: number;
    hoverItemIndex?: number;
    floatingConfig?: {};
    class?: string;
    handleClear?: () => void;
    ariaValues?: (values: any) => string;
    ariaListOpen?: (label: any, count: any) => string;
    ariaFocused?: () => string;
}, {
    pointerup: PointerEvent;
    mousedown: MouseEvent;
    keydown: KeyboardEvent;
    input: CustomEvent<any>;
    hoverItem: CustomEvent<any>;
    filter: CustomEvent<any>;
    clear: CustomEvent<any>;
    focus: CustomEvent<any>;
    blur: CustomEvent<any>;
    change: CustomEvent<any>;
    select: CustomEvent<any>;
} & {
    [evt: string]: CustomEvent<any>;
}, {
    'list-prepend': {};
    list: {
        filteredItems: any;
    };
    item: {
        item: any;
        index: any;
    };
    empty: {};
    'list-append': {};
    prepend: {};
    selection: {
        selection: any;
    };
    'multi-clear-icon': {};
    'loading-icon': {};
    'clear-icon': {};
    'chevron-icon': {
        listOpen: boolean;
    };
    'input-hidden': {
        value: any;
    };
    required: {
        value: any;
    };
}> {
    get getFilteredItems(): () => any;
    get handleClear(): () => void;
}
export type SelectProps = typeof __propDef.props;
export type SelectEvents = typeof __propDef.events;
export type SelectSlots = typeof __propDef.slots;
import _filter from "../filter";
import _getItems from "../get-items";
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        loading?: boolean;
        loadOptions?: any;
        filterText?: string;
        items?: any;
        multiple?: boolean;
        value?: any;
        itemId?: string;
        groupBy?: any;
        filterSelectedItems?: boolean;
        itemFilter?: (label: any, filterText: any, option: any) => boolean;
        label?: string;
        required?: boolean;
        id?: any;
        input?: any;
        filter?: typeof _filter;
        name?: any;
        justValue?: any;
        getItems?: typeof _getItems;
        container?: any;
        multiFullItemClearable?: boolean;
        disabled?: boolean;
        focused?: boolean;
        placeholder?: string;
        placeholderAlwaysShow?: boolean;
        groupFilter?: (groups: any) => any;
        groupHeaderSelectable?: boolean;
        containerStyles?: string;
        hasError?: boolean;
        closeListOnChange?: boolean;
        clearFilterTextOnBlur?: boolean;
        createGroupHeaderItem?: (groupValue: any, item: any) => {
            [x: string]: any;
            value: any;
        };
        getFilteredItems?: () => any;
        searchable?: boolean;
        inputStyles?: string;
        clearable?: boolean;
        listOpen?: boolean;
        debounce?: (fn: any, wait?: number) => void;
        debounceWait?: number;
        hideEmptyState?: boolean;
        inputAttributes?: {};
        listAutoWidth?: boolean;
        showChevron?: boolean;
        listOffset?: number;
        hoverItemIndex?: number;
        floatingConfig?: {};
        class?: string;
        handleClear?: () => void;
        ariaValues?: (values: any) => string;
        ariaListOpen?: (label: any, count: any) => string;
        ariaFocused?: () => string;
    };
    events: {
        pointerup: PointerEvent;
        mousedown: MouseEvent;
        keydown: KeyboardEvent;
        input: CustomEvent<any>;
        hoverItem: CustomEvent<any>;
        filter: CustomEvent<any>;
        clear: CustomEvent<any>;
        focus: CustomEvent<any>;
        blur: CustomEvent<any>;
        change: CustomEvent<any>;
        select: CustomEvent<any>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        'list-prepend': {};
        list: {
            filteredItems: any;
        };
        item: {
            item: any;
            index: any;
        };
        empty: {};
        'list-append': {};
        prepend: {};
        selection: {
            selection: any;
        };
        'multi-clear-icon': {};
        'loading-icon': {};
        'clear-icon': {};
        'chevron-icon': {
            listOpen: boolean;
        };
        'input-hidden': {
            value: any;
        };
        required: {
            value: any;
        };
    };
};
export {};
