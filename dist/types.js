"use strict";
exports.__esModule = true;
function parseType(type) {
    if (type === "()") {
        return {
            nullable: false,
            outer: "",
            inner: type,
            full: type
        };
    }
    var nullable = type.startsWith("Maybe ");
    var withMaybeStripped = type
        .replace("Maybe ", "")
        .replace(/^\(/, "")
        .replace(/\)$/, "");
    var container = (function () {
        if (withMaybeStripped.startsWith("List ")) {
            return "List";
        }
        else if (withMaybeStripped.startsWith("Dict String ")) {
            return "Dict";
        }
        else {
            return "";
        }
    })();
    var withContainerStripped = withMaybeStripped
        .replace("List ", "")
        .replace("Dict String ", "");
    return {
        nullable: nullable,
        outer: container,
        inner: withContainerStripped,
        full: type
    };
}
exports.parseType = parseType;
function toTsType(t) {
    var t_ = (function () {
        if (t.full === "String") {
            return "string";
        }
        else if (t.full === "Int") {
            return "number";
        }
        else if (t.full === "Bool") {
            return "boolean";
        }
        else if (t.outer === "List") {
            return t.inner + "[]";
        }
        else if (t.outer === "Dict") {
            return "{ [dynamic:string]: " + toTsType({
                inner: t.inner,
                outer: "",
                nullable: false,
                full: t.inner
            }) + "}";
        }
        else {
            return t.inner;
        }
    })();
    return t.nullable ? t_ + " | null" : t_;
}
exports.toTsType = toTsType;
