import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# First fix the user.role type issue in AuthContext.tsx
auth_filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/context/AuthContext.tsx"
with open(auth_filepath, "r") as f:
    auth_content = f.read()
# `export type Role = 'admin' | 'manager' | 'cashier' | 'kitchen';`
# AuthContext is fine, it was complaining that user.role type didn't have 'admin' because it inferred differently? No, the type is exported from useStaff.ts.

# Remove the old state block
old_state_block = """  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '895518') { // Default PIN
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };"""

new_auth_block = """  const { user, loading: authLoading, login, logout, hasPermission } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await login(pin);
    if (!success) {
      setError(true);
      setPin('');
    } else {
      setError(false);
    }
    setIsLoggingIn(false);
  };"""

content = content.replace(old_state_block, new_auth_block)

content = content.replace("if (isChecking) {", "if (authLoading) {")
content = content.replace("if (!isAuthenticated) {", "if (!user) {")

content = content.replace("Good morning, Bella!", "Good morning, {user?.name}!")
content = content.replace("Good afternoon, Bella!", "Good afternoon, {user?.name}!")
content = content.replace("Good evening, Bella!", "Good evening, {user?.name}!")

content = content.replace(
    """<span className="font-extrabold text-sm truncate text-white block">Bella</span>""",
    """<span className="font-extrabold text-sm truncate text-white block">{user?.name}</span>"""
)
content = content.replace(
    """<span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Store Owner</span>""",
    """<span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">{user?.role}</span>"""
)
content = content.replace(
    """<span className="text-sm font-bold text-slate-900 block truncate">Bella</span>""",
    """<span className="text-sm font-bold text-slate-900 block truncate">{user?.name}</span>"""
)
content = content.replace(
    """<span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">Store Owner</span>""",
    """<span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">{user?.role}</span>"""
)

# Fix logout
content = content.replace(
    """localStorage.removeItem('adminAuth');
                      setIsAuthenticated(false);""",
    """logout();"""
)
content = content.replace(
    """onClick={() => {
                  if(window.confirm('Are you sure you want to log out?')) {
                    localStorage.removeItem('adminAuth');
                    window.location.reload();
                  }
                }}""",
    """onClick={() => {
                  if(window.confirm('Are you sure you want to log out?')) {
                    logout();
                  }
                }}"""
)


with open(filepath, "w") as f:
    f.write(content)

print("Rewritten")
