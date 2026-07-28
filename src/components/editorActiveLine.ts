import { EditorView, Decoration } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const executingLineDecoration = Decoration.line({
  attributes: { class: 'cm-executing-line' }
});

export function activeLineExtension(lineNumber?: number) {
  return EditorView.decorations.compute(['doc'], (state) => {
    if (!lineNumber || lineNumber < 1 || lineNumber > state.doc.lines) {
      return Decoration.none;
    }
    const builder = new RangeSetBuilder<Decoration>();
    const line = state.doc.line(lineNumber);
    builder.add(line.from, line.from, executingLineDecoration);
    return builder.finish();
  });
}
