declare module 'markmap-lib' {
    export class Transformer {
        transform(markdown: string): { root: any; features: any };
    }
}

declare module 'markmap-view' {
    export class Markmap {
        static create(el: string | HTMLElement | SVGElement | null, options?: any, data?: any): Markmap;
        setData(data: any): void;
        fit(): void;
    }
}

declare module 'markmap-toolbar' {
    export class Toolbar {
        static create(mm: any): { el: HTMLElement; setBrand: (arg: boolean) => void };
    }
}
