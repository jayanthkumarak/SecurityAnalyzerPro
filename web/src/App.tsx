import { useState } from 'react'
import { FileUp, Sparkles, Loader2 } from 'lucide-react'
import './App.css'

const App = () => {
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setReport(null)
    const form = new FormData()
    form.append('path', file)
    try {
      const r = await fetch('/analyze', {
        method: 'POST',
        body: form,
      }).then(res => res.json())
      setReport(r.report)
    } catch (e) {
      setError('Failed to analyze artifact.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mt-16 mb-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-blue-500 drop-shadow" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
            ForensicAnalyzerPro <span className="text-blue-500">Web</span>
          </h1>
        </div>
        <p className="text-slate-600 mb-8 text-lg">
          Upload a digital artifact to generate a forensic Markdown report.<br />
          <span className="text-blue-400 font-medium">Powered by AI.</span>
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          <label className="flex flex-col items-center w-full md:w-auto cursor-pointer group">
            <input
              type="file"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 group-hover:bg-blue-50 transition font-medium text-slate-700 shadow-sm">
              <FileUp className="w-5 h-5 text-blue-400" />
              {file ? file.name : 'Choose file'}
            </span>
          </label>
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-500 text-white font-semibold shadow-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!file || loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Analyze
          </button>
        </div>
        {error && (
          <div className="text-red-500 font-medium mb-4">{error}</div>
        )}
        {report && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2 text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Report
            </h2>
            <textarea
              value={report}
              readOnly
              className="w-full h-96 p-4 rounded-xl border border-slate-200 bg-slate-50 font-mono text-base text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ resize: 'vertical' }}
            />
          </div>
        )}
      </div>
      <footer className="text-slate-400 text-sm mb-4">
        &copy; {new Date().getFullYear()} ForensicAnalyzerPro. Inspired by Perplexity.ai.
      </footer>
    </div>
  )
}

export default App
