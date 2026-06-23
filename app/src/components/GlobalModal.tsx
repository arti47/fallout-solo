import { useUIState } from '../store/uiState';

export default function GlobalModal() {
  const { modal, closeModal } = useUIState();

  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="border-2 border-[#14FF00] bg-black p-6 max-w-md w-full shadow-[0_0_15px_rgba(20,255,0,0.5)]">
        <h3 className="text-xl font-bold text-[#14FF00] mb-4 border-b border-[#14FF00] pb-2 uppercase flex items-center gap-2">
          {modal.type === 'alert' ? 'SYSTEM ALERT' : 'SYSTEM PROMPT'}
        </h3>
        
        <p className="text-[#14FF00] mb-6 whitespace-pre-wrap leading-relaxed text-sm">
          {modal.message}
        </p>
        
        <div className="flex justify-end gap-4">
          {modal.type === 'confirm' && (
            <button
              onClick={() => {
                // Close BEFORE running the callback: a callback may open a
                // follow-up modal, which must not be wiped out by this close.
                closeModal();
                if (modal.onCancel) modal.onCancel();
              }}
              className="px-4 py-2 border border-[#14FF00] text-[#14FF00] hover:bg-[#14FF00] hover:text-black uppercase font-bold transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            onClick={() => {
              closeModal();
              if (modal.onConfirm) modal.onConfirm();
            }}
            className="px-4 py-2 bg-[#14FF00] text-black hover:bg-[#14FF00]/80 uppercase font-bold transition-colors"
          >
            {modal.type === 'confirm' ? 'Proceed' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
