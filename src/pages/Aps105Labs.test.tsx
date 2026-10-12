import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Aps105Labs } from './Aps105Labs';

test('the C lab expands with its edited code, keeps an Escape typed in the editor, and comes back unchanged', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Aps105Labs />
    </MemoryRouter>,
  );
  const editor = document.querySelector<HTMLTextAreaElement>('.c-editor-ta')!;
  fireEvent.change(editor, { target: { value: 'int main(void) { return 7; }' } });

  fireEvent.click(screen.getByRole('button', { name: 'Expand C lab' }));
  const dialog = screen.getByRole('dialog', { name: 'C lab' });
  expect(dialog.querySelector('.c-editor-ta')).toBe(editor);

  // Escape, then Tab, is how a keyboard leaves the editor: the Escape is not the frame's
  fireEvent.keyDown(editor, { key: 'Escape' });
  expect(screen.getByRole('dialog', { name: 'C lab' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Close C lab' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.querySelector('.c-editor-ta')).toBe(editor);
  expect(editor.value).toBe('int main(void) { return 7; }');
});
