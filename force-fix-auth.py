import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# First, remove the old state variables if they exist
content = re.sub(
    r"const \[isAuthenticated, setIsAuthenticated\] = useState\(false\);\n",
    "",
    content
)
content = re.sub(
    r"const \[isChecking, setIsChecking\] = useState\(true\);\n",
    "",
    content
)

# Second, replace the old handleLogin block and useEffect block completely
old_effect = """  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);"""

if old_effect in content:
    content = content.replace(old_effect, "")

old_handleLogin = """  const handleLogin = (e: React.FormEvent) => {
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

new_handleLogin = """  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
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

if old_handleLogin in content:
    content = content.replace(old_handleLogin, new_handleLogin)
else:
    print("Could not find exact handleLogin block. Using regex.")
    content = re.sub(
        r"  const handleLogin = \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n",
        new_handleLogin + "\n",
        content
    )

# Fix loading checking variable in render
content = content.replace("if (isChecking) return", "if (authLoading) return")

# Fix disabled condition on the submit button. It was 6 digits, but PIN can be 4 digits.
content = content.replace("disabled={pin.length < 6}", "disabled={pin.length < 4 || isLoggingIn}")

with open(filepath, "w") as f:
    f.write(content)

print("Auth block rewritten.")
