/** Suggestions for the free-text Year field. Teachers can still type anything (e.g. "Reception", "Form 2"). */
export function YearOptions() {
  return (
    <datalist id="year-options">
      <option value="Reception" />
      {Array.from({ length: 13 }, (_, i) => (
        <option key={i} value={`Year ${i + 1}`} />
      ))}
    </datalist>
  )
}
