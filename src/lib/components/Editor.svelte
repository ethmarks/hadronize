<!--
Adapted from
https://github.com/ethmarks/nolet/blob/main/src/lib/components/Editor.svelte
-->

<script lang="ts">
    import { createEditor } from "prism-code-editor";
    import { editorCommands, defaultKeymap } from "prism-code-editor/commands";
    import "prism-code-editor/prism/languages/javascript";
    import type { PrismEditor } from "prism-code-editor";

    import "prism-code-editor/themes/atom-one-dark.css";
    import "prism-code-editor/layout.css";
    import "prism-code-editor/scrollbar.css";
    import "prism-code-editor/autocomplete.css";
    import "prism-code-editor/autocomplete-icons.css";
    import { onMount } from "svelte";

    interface Props {
        initialValue: string;
        readOnly: boolean;
        onUpdate?: (val: string) => void;
    }

    let { initialValue, readOnly, onUpdate }: Props = $props();

    // To prevent CLS
    const WRAPPER_PADDING_PX = 8;
    const FONT_SIZE_PX = 22.4;
    let lineCount = $derived(initialValue.split(/\r\n|\r|\n/).length);
    let height = $derived(WRAPPER_PADDING_PX * 2 + FONT_SIZE_PX * lineCount);

    let editorElement: HTMLDivElement;
    let editor: PrismEditor;

    async function create(value: string) {
        // These imports throw errors when rendered in SSR, so we import them
        // lazily
        const {
            strictFilter,
            autoComplete,
            registerCompletions,
            completeFromList,
        } = await import("prism-code-editor/autocomplete");
        const { cursorPosition } = await import("prism-code-editor/cursor");
        const {
            completeKeywords,
            jsDocCompletion,
            jsSnipets,
            jsContext,
            jsCompletion,
        } = await import("prism-code-editor/autocomplete/javascript");
        const { searchWidget } = await import("prism-code-editor/search");

        registerCompletions(
            ["javascript", "js", "jsx", "tsx", "typescript", "ts"],
            {
                context: jsContext,
                sources: [
                    jsCompletion(window),
                    completeKeywords,
                    jsDocCompletion,
                    completeFromList(jsSnipets),
                ],
            },
        );

        editorElement.innerHTML = "";
        editor?.remove();
        editor = createEditor(editorElement, {
            language: "js",
            onUpdate,
            value,
            readOnly,
        });

        editor.addExtensions(
            editorCommands(defaultKeymap),
            cursorPosition(),
            searchWidget(),
            autoComplete({ filter: strictFilter }),
        );
    }

    onMount(() => {
        create(initialValue);
    });
</script>

<div bind:this={editorElement} class="editor-container">
    <p style:min-height="{height}px">
        Loading {readOnly ? "code block" : "editor"}...
    </p>
</div>

<style lang="scss">
    .editor-container {
        margin-block: 1rem;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    /** To undo holiday.css styles */
    :global(.editor-container textarea) {
        box-shadow: none;
    }

    p {
        margin: 0;
        line-height: 1em;
        text-align: center;
        background: var(--pce-bg, #292c33);
    }
</style>
