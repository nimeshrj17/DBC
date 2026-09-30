with open('src/components/ui/SwipeToConfirm.tsx', 'r') as f:
    content = f.read()

# Add a ref to track if it has fired
content = content.replace(
    "const containerRef = useRef<HTMLDivElement>(null);",
    "const containerRef = useRef<HTMLDivElement>(null);\n  const hasFired = useRef(false);"
)

# Update handleDrag
old_drag = """  const handleDrag = (clientX: number) => {
    if (!isDragging || isConfirmed || isLoading) return;"""

new_drag = """  const handleDrag = (clientX: number) => {
    if (!isDragging || isConfirmed || isLoading || hasFired.current) return;"""
content = content.replace(old_drag, new_drag)

old_fire = """    if (newWidth >= maxWidth * 0.95) {
      setIsConfirmed(true);
      setSliderWidth(maxWidth);
      setIsDragging(false);
      onConfirm();
    }"""

new_fire = """    if (newWidth >= maxWidth * 0.95) {
      hasFired.current = true;
      setIsConfirmed(true);
      setSliderWidth(maxWidth);
      setIsDragging(false);
      onConfirm();
    }"""
content = content.replace(old_fire, new_fire)

# Reset hasFired when isLoading finishes
old_reset = """  useEffect(() => {
    if (!isLoading && isConfirmed) {
      const t = setTimeout(() => {
        setIsConfirmed(false);
        setSliderWidth(56);
      }, 2000);"""

new_reset = """  useEffect(() => {
    if (!isLoading && isConfirmed) {
      const t = setTimeout(() => {
        setIsConfirmed(false);
        setSliderWidth(56);
        hasFired.current = false;
      }, 2000);"""
content = content.replace(old_reset, new_reset)


with open('src/components/ui/SwipeToConfirm.tsx', 'w') as f:
    f.write(content)

