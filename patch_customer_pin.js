const fs = require('fs');
let code = fs.readFileSync('src/app/order/[tableId]/page.tsx', 'utf8');

const target = `const handleJoinSession = async () => {`;
const replacement = `const [isRequestingReset, setIsRequestingReset] = useState(false);
  const handleRequestReset = async () => {
    setIsRequestingReset(true);
    try {
      const res = await fetch(\`/api/tables/\${tableId}/reset-request\`, { method: 'POST' });
      if (res.ok) {
        toast.success('Reset requested! Please wait for staff.');
      }
    } catch (e) {
      toast.error('Failed to request reset');
    } finally {
      setIsRequestingReset(false);
    }
  };
  
  const handleJoinSession = async () => {`;

code = code.replace(target, replacement);

const buttonTarget = `            {isJoining ? 'Verifying...' : 'Join Table'}
          </button>
        </div>
      </div>`;
const buttonReplacement = `            {isJoining ? 'Verifying...' : 'Join Table'}
          </button>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Are you a new customer?</p>
            <button 
              onClick={handleRequestReset}
              disabled={isRequestingReset || table?.resetRequested}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {table?.resetRequested ? 'Staff Notified - Please Wait...' : isRequestingReset ? 'Requesting...' : 'Request Table Reset'}
            </button>
          </div>
        </div>
      </div>`;

code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/app/order/[tableId]/page.tsx', code);
