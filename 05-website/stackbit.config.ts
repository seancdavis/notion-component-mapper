import { defineStackbitConfig } from '@stackbit/types';

export default defineStackbitConfig({
    stackbitVersion: '~0.6.0',
    cmsName: 'git',
    pagesDir: 'src/pages',
    models: {
        page: {
            type: 'page',
            urlPath: '/{slug}',
            filePath: '{slug}.json',
            hideContent: true,
            fields: [
                { name: 'title', type: 'string', required: true },
                { name: 'sections', type: 'list', items: { type: 'model', models: ['paragraph', 'heading'] } }
            ]
        },
        paragraph: {
            type: 'object',
            labelField: 'content',
            fields: [{ name: 'content', type: 'markdown', required: true }]
        },
        heading: {
            type: 'object',
            labelField: 'content',
            fields: [
                { name: 'content', type: 'string', required: true },
                { name: 'level', type: 'enum', required: true, options: [1, 2, 3, 4, 5, 6] }
            ]
        }
    }
});
