export var Mode;
(function (Mode) {
    Mode["text"] = "text";
    Mode["tree"] = "tree";
    Mode["table"] = "table";
})(Mode || (Mode = {}));
export var SelectionType;
(function (SelectionType) {
    SelectionType["after"] = "after";
    SelectionType["inside"] = "inside";
    SelectionType["key"] = "key";
    SelectionType["value"] = "value";
    SelectionType["multi"] = "multi";
    SelectionType["text"] = "text"; // in text mode
})(SelectionType || (SelectionType = {}));
export var CaretType;
(function (CaretType) {
    CaretType["after"] = "after";
    CaretType["key"] = "key";
    CaretType["value"] = "value";
    CaretType["inside"] = "inside";
})(CaretType || (CaretType = {}));
export var ValidationSeverity;
(function (ValidationSeverity) {
    ValidationSeverity["info"] = "info";
    ValidationSeverity["warning"] = "warning";
    ValidationSeverity["error"] = "error";
})(ValidationSeverity || (ValidationSeverity = {}));
export var SearchField;
(function (SearchField) {
    SearchField["key"] = "key";
    SearchField["value"] = "value";
})(SearchField || (SearchField = {}));
export var SortDirection;
(function (SortDirection) {
    SortDirection["asc"] = "asc";
    SortDirection["desc"] = "desc";
})(SortDirection || (SortDirection = {}));
export var UpdateSelectionAfterChange;
(function (UpdateSelectionAfterChange) {
    UpdateSelectionAfterChange["no"] = "no";
    UpdateSelectionAfterChange["self"] = "self";
    UpdateSelectionAfterChange["nextInside"] = "nextInside";
})(UpdateSelectionAfterChange || (UpdateSelectionAfterChange = {}));
