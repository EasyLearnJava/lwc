import postcss from 'postcss';
import cssnano from 'cssnano';

import serialize from './serialize';
import postcssPluginLwc from './lwc-postcss-plugin';

export interface Config {
    /** CSS custom properties configuration */
    customProperties?: {
        /** Disallow definition of CSS custom properties when set to false */
        allowDefinition?: boolean;

        /** Name of the module to resolve custom properties lookup */
        resolverModule?: string;
    };

    outputConfig?: {
        /** Apply minification to the generated code */
        minify?: boolean;
    };
}

const CSS_NANO_CONFIG = {
    preset: ['default'],

    // Disable SVG compression, since it prevent the compiler to be bundle by webpack since
    // it dynamically require the svgo package: https://github.com/svg/svgo
    svgo: false,

    // Disable zindex normalization, since it only works when it works only if the rules
    // css file contains all the selectors applied on the page.
    zindex: false,
};

export function transform(src: string, id: string, config: Config = {}): { code: string } {
    if (src === '') {
        return { code: 'export default undefined' };
    }

    const allowDefinition = !config.customProperties || config.customProperties.allowDefinition;
    const collectVarFunctions = Boolean(config.customProperties && config.customProperties.resolverModule);
    const minify = config.outputConfig && config.outputConfig.minify;

    const plugins = [
        postcssPluginLwc({
            customProperties: { allowDefinition, collectVarFunctions },
            filename: id
        })
    ];

    if (minify) {
        plugins.push(cssnano(CSS_NANO_CONFIG));
    }

    const result = postcss(plugins).process(src, { from: id });

    return { code: serialize(result, config) };
}