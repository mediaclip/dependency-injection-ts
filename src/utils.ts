export function ident(str: string, spaces: string) {
    return str.split('\n').join('\n' + spaces);
}
