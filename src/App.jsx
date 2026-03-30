import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, CheckCircle, XCircle, AlertCircle, BarChart3,
  BookOpen, LayoutDashboard, ChevronRight, ChevronLeft,
  Flag, Award, RotateCcw, Play, Check, X, LogOut, Lock, User, FileText, Users, ShieldCheck, ShieldOff
} from 'lucide-react';

// --- API HELPERS ---
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const apiFetch = (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  }).then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
};

// --- SEED DATA & CONSTANTS ---
// Pass mark ebong exam er shomoy nirdharon
const PASS_MARK = 85;
const EXAM_DURATION = 60 * 60; 
const Q_PER_EXAM = 80;

const psmTopics = [
  "Empiricism", "Scrum Values", "Scrum Team", "Events", "Artifacts", 
  "Done", "Scaling", "Self-Managing Teams", "Facilitation", 
  "Coaching & Mentoring", "Leadership Styles / Stances", 
  "Forecasting & Release Planning", "Product Backlog Management"
];

const pspoTopics = [
  "Empiricism", "Scrum Team", "Events", "Artifacts", "Done", 
  "Self-Managing Teams", "Forecasting & Release Planning", 
  "Product Vision", "Product Value", "Product Backlog Management", 
  "Business Strategy", "Stakeholders & Customers"
];

// Proshner bhandar (Question Pool)
const questionPool = [
  { text: "Who is required to attend the Daily Scrum?", options: ["The Scrum Master.", "The Development Team.", "The Developers.", "The entire Scrum Team."], correct: [2], explanation: "Only the Developers are required to attend the Daily Scrum. The Scrum Master and Product Owner can attend if they are also working on items in the Sprint Backlog." },
  { text: "When does a Sprint conclude?", options: ["When all Sprint Backlog items are completed.", "When the timebox expires.", "When the Product Owner accepts the Increment.", "When the Sprint Retrospective ends."], correct: [1], explanation: "A Sprint is a timebox. It concludes when the timebox expires, culminating in the Sprint Retrospective." },
  { text: "What is the primary responsibility of the Product Owner?", options: ["Directing the Developers on how to build the product.", "Managing the project timeline and budget.", "Maximizing the value of the product resulting from the work of the Scrum Team.", "Facilitating Scrum events."], correct: [2], explanation: "The PO is accountable for maximizing the value of the product and effective Product Backlog management." },
  { text: "Which Scrum artifact provides transparency into the work the Developers plan to accomplish during the Sprint?", options: ["Product Backlog", "Increment", "Sprint Backlog", "Definition of Done"], correct: [2], explanation: "The Sprint Backlog is the highly visible, real-time picture of the work that the Developers plan to accomplish during the Sprint." },
  { text: "What is the result of the Sprint Review?", options: ["A revised Product Backlog that defines the probable Product Backlog items for the next Sprint.", "A finished product ready for release.", "A list of improvements for the Scrum Team to implement in the next Sprint.", "Approval of the Developers' work by the stakeholders."], correct: [0], explanation: "The result of the Sprint Review is a revised Product Backlog that defines the probable Product Backlog items for the next Sprint." },
  { text: "True or False: The Scrum Master is a management position.", options: ["True", "False"], correct: [0], explanation: "True. The Scrum Master manages the Scrum framework and removes impediments, though they do not manage people directly." },
  { text: "What are the three pillars of Empiricism?", options: ["Planning, Doing, Checking", "Transparency, Inspection, Adaptation", "Respect, Courage, Focus", "Vision, Value, Validation"], correct: [1], explanation: "Scrum is founded on empirical process control theory. The three pillars are Transparency, Inspection, and Adaptation." },
  { text: "When multiple Scrum Teams are working on the same product, should all of their Increments be integrated every Sprint?", options: ["Yes, but only if the Product Owner requests it.", "No, each team can have its own definition of done and integrate later.", "Yes, otherwise it is not an Increment of value.", "No, it's too complex to integrate multiple teams' work every Sprint."], correct: [2], explanation: "Yes. When multiple Scrum Teams work on a product, a single Definition of Done applies to the integrated Increment." },
  { text: "Who has the authority to cancel a Sprint?", options: ["The Scrum Master", "The Developers", "The Product Owner", "The Stakeholders"], correct: [2], explanation: "Only the Product Owner has the authority to cancel the Sprint, although they may do so under influence from stakeholders or the Scrum Team." },
  { text: "During the Sprint Planning, who defines the Sprint Goal?", options: ["The Product Owner", "The Scrum Master", "The Developers", "The entire Scrum Team"], correct: [3], explanation: "The whole Scrum Team collaborates to define a Sprint Goal that communicates why the Sprint is valuable to stakeholders." },
  { text: "What best describes the relationship between the Product Vision and the Product Backlog?", options: ["The Product Backlog is a breakdown of the Product Vision into tasks.", "The Product Vision describes the future state of the product; the Product Backlog contains what is needed to reach it.", "They are the same thing.", "The Product Vision is created after the Product Backlog is fully defined."], correct: [1], explanation: "The Product Goal is the long-term objective for the Scrum Team, and the Product Backlog emerges to fulfill it." },
  { text: "If the Developers find they have too much work in the Sprint, who should they collaborate with to adjust the Sprint Backlog?", options: ["The Scrum Master", "The Product Owner", "Management", "Stakeholders"], correct: [1], explanation: "If the work turns out to be different than they expected, they collaborate with the Product Owner to negotiate the scope of the Sprint Backlog within the Sprint." }
];

// Mock exam toiri korar function
const generateExamData = (certName, examIndex) => {
  const topics = certName === 'PSM I' ? psmTopics : pspoTopics;
  const questions = [];
  for (let i = 0; i < Q_PER_EXAM; i++) {
    const baseQ = questionPool[i % questionPool.length];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const options = [...baseQ.options];
    const correctAnswersText = baseQ.correct.map(idx => baseQ.options[idx]);
    options.sort(() => Math.random() - 0.5);
    const newCorrectIndices = correctAnswersText.map(text => options.indexOf(text));

    questions.push({
      id: `q_${examIndex}_${i}`,
      text: baseQ.text,
      options: options,
      correct: newCorrectIndices,
      topic: topic,
      explanation: baseQ.explanation
    });
  }
  return {
    id: `${certName.replace(/\s/g, '')}_Exam_${examIndex + 1}`,
    title: `Mock Exam ${examIndex + 1}`,
    cert: certName,
    questions
  };
};

const examsData = {
  'PSM I': Array.from({ length: 12 }).map((_, i) => generateExamData('PSM I', i)),
  'PSPO I': Array.from({ length: 12 }).map((_, i) => generateExamData('PSPO I', i))
};

// --- AUTH MODAL COMPONENT ---
function AuthScreen({ onAuthSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const data = await apiFetch(endpoint, { method: 'POST', body: { email, password } });
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex justify-center mb-6 mt-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Award className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">ScrumMastery Pro</h2>
        <p className="text-center text-gray-500 mb-8 px-4">
          {isLogin ? 'Log in to save your data permanently' : 'Create an account to track your progress'}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-600 font-bold hover:underline focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [activeCert, setActiveCert] = useState('PSM I');
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeExam, setActiveExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [examState, setExamState] = useState(null);
  const [reviewAttempt, setReviewAttempt] = useState(null);

  // Check for saved login on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthLoading(false);
  }, []);

  // Fetch attempts from SQLite backend when user logs in
  useEffect(() => {
    if (!user) {
      setAttempts([]);
      return;
    }
    apiFetch('/api/attempts')
      .then(data => setAttempts(data))
      .catch(err => console.error('Error fetching attempts:', err));
  }, [user]);

  const handleStartExam = (exam) => {
    setActiveExam(exam);
    setExamState({
      answers: {},
      marked: [],
      timeRemaining: EXAM_DURATION,
      startTime: Date.now(),
      currentIndex: 0
    });
    setCurrentView('exam');
  };

  const handleSubmitExam = async (finalAnswers, timeUsed) => {
    let correctCount = 0;
    const questionResults = activeExam.questions.map((q, idx) => {
      const selected = finalAnswers[idx] || [];
      const isCorrect = selected.length === q.correct.length && 
                        selected.every(val => q.correct.includes(val));
      if (isCorrect) correctCount++;
      return { qId: q.id, selected, isCorrect, topic: q.topic };
    });

    const score = (correctCount / Q_PER_EXAM) * 100;
    const passed = score >= PASS_MARK;

    const attemptData = {
      examId: activeExam.id,
      examTitle: activeExam.title,
      cert: activeCert,
      date: new Date().toISOString(),
      score,
      passed,
      correctCount,
      timeUsed,
      questionResults
    };

    if (user) {
      try {
        const result = await apiFetch('/api/attempts', { method: 'POST', body: attemptData });
        setReviewAttempt({ id: result.id, ...attemptData });
        setAttempts(prev => [{ id: result.id, ...attemptData }, ...prev]);
      } catch (error) {
        console.error('Error saving attempt:', error);
        setReviewAttempt({ id: Date.now().toString(), ...attemptData });
      }
    } else {
      const newAttempt = { id: Date.now().toString(), ...attemptData };
      setAttempts(prev => [newAttempt, ...prev]);
      setReviewAttempt(newAttempt);
    }

    setExamState(null);
    setCurrentView('results');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setAttempts([]);
    setCurrentView('dashboard');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading Platform...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {showAuthModal && <AuthScreen onAuthSuccess={(u) => { setUser(u); setShowAuthModal(false); }} onClose={() => setShowAuthModal(false)} />}
      
      {!user && currentView !== 'exam' && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 text-center text-sm font-medium text-blue-800 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          You are currently playing as a Guest. To permanently save your history, please 
          <button onClick={() => setShowAuthModal(true)} className="ml-1 underline font-bold hover:text-blue-900">Login / Signup</button>.
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <Award className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">ScrumMastery Pro</span>
          </div>
          
          <div className="flex items-center gap-4">
            {currentView !== 'exam' && (
              <nav className="flex items-center gap-1 sm:gap-2 mr-4 border-r border-gray-200 pr-4">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${currentView === 'analytics' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="hidden sm:inline">Analytics</span>
                </button>
                <button
                  onClick={() => setCurrentView('report')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${currentView === 'report' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">Report</span>
                </button>
                {user?.is_admin && (
                  <button
                    onClick={() => setCurrentView('users')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${currentView === 'users' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="hidden sm:inline">Users</span>
                  </button>
                )}
              </nav>
            )}

            {user ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="hidden md:inline font-medium flex items-center gap-1">
                  {user.email}
                  {user.is_admin && <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">ADMIN</span>}
                </span>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Sign Out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard activeCert={activeCert} setActiveCert={setActiveCert} attempts={attempts} onStartExam={handleStartExam} />
        )}
        {currentView === 'exam' && activeExam && (
          <ExamEngine exam={activeExam} initialState={examState} onSubmit={handleSubmitExam} />
        )}
        {currentView === 'results' && reviewAttempt && (
          <ResultsView attempt={reviewAttempt} onReview={() => setCurrentView('review')} onBack={() => setCurrentView('dashboard')} />
        )}
        {currentView === 'review' && reviewAttempt && (
          <ReviewMode attempt={reviewAttempt} exam={examsData[reviewAttempt.cert].find(e => e.id === reviewAttempt.examId)} onBack={() => setCurrentView('results')} />
        )}
        {currentView === 'analytics' && (
          <AnalyticsDashboard activeCert={activeCert} setActiveCert={setActiveCert} attempts={attempts} />
        )}
        {currentView === 'report' && (
          <ReportSection user={user} />
        )}
        {currentView === 'users' && user?.is_admin && (
          <UserList currentUserId={user.id} />
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Dashboard({ activeCert, setActiveCert, attempts, onStartExam }) {
  const certAttempts = attempts.filter(a => a.cert === activeCert);
  const totalAttempts = certAttempts.length;
  const passedExams = certAttempts.filter(a => a.passed).length;
  const bestScore = totalAttempts > 0 ? Math.max(...certAttempts.map(a => a.score)) : 0;
  const avgScore = totalAttempts > 0 ? (certAttempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts).toFixed(1) : 0;

  const exams = examsData[activeCert];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
          {['PSM I', 'PSPO I'].map(cert => (
            <button
              key={cert}
              onClick={() => setActiveCert(cert)}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${activeCert === cert ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Attempts', val: totalAttempts, icon: BookOpen },
          { label: 'Exams Passed', val: passedExams, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Best Score', val: `${bestScore.toFixed(1)}%`, icon: Award, color: 'text-yellow-500' },
          { label: 'Average Score', val: `${avgScore}%`, icon: BarChart3 }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color ? stat.color.replace('text', 'bg').replace('600', '100').replace('500', '100') : 'bg-blue-100'} ${stat.color || 'text-blue-600'}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => {
          const examAttempts = certAttempts.filter(a => a.examId === exam.id);
          const highest = examAttempts.length > 0 ? Math.max(...examAttempts.map(a => a.score)) : null;
          const last = examAttempts.length > 0 ? examAttempts[0] : null;

          return (
            <div key={exam.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900">{exam.title}</h3>
                {highest !== null && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${highest >= PASS_MARK ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {highest >= PASS_MARK ? 'PASSED' : 'FAILED'}
                  </span>
                )}
              </div>
              
              <div className="flex-1 space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex justify-between"><span>Questions:</span> <span className="font-medium text-gray-900">80</span></div>
                <div className="flex justify-between"><span>Time:</span> <span className="font-medium text-gray-900">60 mins</span></div>
                <div className="flex justify-between"><span>Attempts:</span> <span className="font-medium text-gray-900">{examAttempts.length}</span></div>
                {last && (
                  <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
                    <span>Last Score:</span> 
                    <span className={`font-bold ${last.passed ? 'text-green-600' : 'text-red-600'}`}>{last.score.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onStartExam(exam)}
                className="w-full py-3 px-4 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2 group"
              >
                {examAttempts.length > 0 ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {examAttempts.length > 0 ? 'Retake Exam' : 'Start Exam'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExamEngine({ exam, initialState, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(initialState.currentIndex);
  const [answers, setAnswers] = useState(initialState.answers);
  const [marked, setMarked] = useState(new Set(initialState.marked));
  const [timeLeft, setTimeLeft] = useState(initialState.timeRemaining);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [validationError, setValidationError] = useState('');

  const currentQ = exam.questions[currentIndex];

  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIndex) => {
    setValidationError('');
    setAnswers(prev => ({ ...prev, [currentIndex]: [optIndex] }));
  };

  const handleNext = () => {
    if (!answers[currentIndex] || answers[currentIndex].length === 0) {
      setValidationError('You must select an answer before proceeding.');
      return;
    }
    setValidationError('');
    if (currentIndex < exam.questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    setValidationError('');
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const toggleMark = () => {
    const newMarked = new Set(marked);
    if (newMarked.has(currentIndex)) newMarked.delete(currentIndex);
    else newMarked.add(currentIndex);
    setMarked(newMarked);
  };

  const handleFinalSubmit = () => {
    onSubmit(answers, EXAM_DURATION - timeLeft);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[85vh]">
      <div className="bg-white rounded-t-xl border border-gray-200 p-4 flex justify-between items-center shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{exam.title} <span className="text-gray-400 font-normal">| {exam.cert}</span></h2>
          <p className="text-sm text-gray-500">Question {currentIndex + 1} of {exam.questions.length}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="h-1 bg-gray-200 w-full shrink-0">
        <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${((currentIndex + 1) / exam.questions.length) * 100}%` }} />
      </div>

      <div className="bg-white border-x border-gray-200 p-8 flex-1 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-medium text-gray-900 leading-relaxed">
            <span className="text-blue-600 font-bold mr-2">{currentIndex + 1}.</span> 
            {currentQ.text}
          </h3>
          <button onClick={toggleMark} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${marked.has(currentIndex) ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Flag className="w-4 h-4" />
            {marked.has(currentIndex) ? 'Marked' : 'Mark for Review'}
          </button>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentIndex]?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
                <span className={`text-base ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>{opt}</span>
              </button>
            )
          })}
        </div>
        
        {validationError && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg animate-in fade-in">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-b-xl border border-gray-200 p-4 flex justify-between items-center shadow-sm shrink-0">
        <button onClick={handlePrev} disabled={currentIndex === 0} className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {currentIndex === exam.questions.length - 1 ? (
          <button
            onClick={() => {
              if (!answers[currentIndex] || answers[currentIndex].length === 0) {
                setValidationError('You must select an answer before proceeding.');
                return;
              }
              setShowSubmitModal(true);
            }}
            className="px-8 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
          >
            Finish & Submit <CheckCircle className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleNext} className="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-sm">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl scale-in-95">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Submit Exam?</h3>
            <p className="text-gray-600 mb-6">You have answered {Object.keys(answers).length} out of {exam.questions.length} questions. Are you sure you want to finish and submit?</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setShowSubmitModal(false)} className="px-5 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleFinalSubmit} className="px-5 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md">Yes, Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsView({ attempt, onReview, onBack }) {
  const { score, passed, correctCount, timeUsed, questionResults } = attempt;

  const topics = Array.from(new Set(questionResults.map(q => q.topic)));
  const topicStats = topics.map(topic => {
    const qInTopic = questionResults.filter(q => q.topic === topic);
    const correctInTopic = qInTopic.filter(q => q.isCorrect).length;
    return {
      topic,
      total: qInTopic.length,
      correct: correctInTopic,
      percentage: Math.round((correctInTopic / qInTopic.length) * 100)
    };
  }).sort((a, b) => a.percentage - b.percentage);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
      <div className={`p-8 rounded-2xl text-center shadow-sm border ${passed ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
        <div className="flex justify-center mb-4">
          {passed ? <CheckCircle className="w-16 h-16 text-green-500" /> : <XCircle className="w-16 h-16 text-red-500" />}
        </div>
        <h1 className="text-4xl font-extrabold mb-2">{passed ? 'Congratulations! You Passed.' : 'Exam Failed.'}</h1>
        <p className="text-lg opacity-80 mb-6">You scored {score.toFixed(1)}%. The passing score is {PASS_MARK}%.</p>
        
        <div className="flex justify-center gap-8 text-left max-w-lg mx-auto bg-white/60 p-6 rounded-xl backdrop-blur-sm">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-70 font-semibold mb-1">Score</p>
            <p className="text-3xl font-bold">{score.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide opacity-70 font-semibold mb-1">Correct</p>
            <p className="text-3xl font-bold">{correctCount}/{Q_PER_EXAM}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide opacity-70 font-semibold mb-1">Time</p>
            <p className="text-3xl font-bold">{formatTime(timeUsed)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
            <button onClick={onReview} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm flex justify-center items-center gap-2">
              <BookOpen className="w-5 h-5" /> Review Questions
            </button>
            <button onClick={onBack} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition flex justify-center items-center gap-2">
              <LayoutDashboard className="w-5 h-5" /> Back to Dashboard
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Topic Performance
          </h3>
          <div className="space-y-5">
            {topicStats.map(stat => (
              <div key={stat.topic}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{stat.topic}</span>
                  <span className={`font-bold ${stat.percentage < 85 ? 'text-red-600' : 'text-green-600'}`}>
                    {stat.percentage}% ({stat.correct}/{stat.total})
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${stat.percentage < 85 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${stat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewMode({ attempt, exam, onBack }) {
  const [filter, setFilter] = useState('all'); 
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviewQuestions = exam.questions.map((q, idx) => {
    const result = attempt.questionResults[idx];
    return { ...q, ...result, originalIndex: idx };
  });

  const filteredQuestions = useMemo(() => {
    if (filter === 'correct') return reviewQuestions.filter(q => q.isCorrect);
    if (filter === 'incorrect') return reviewQuestions.filter(q => !q.isCorrect);
    return reviewQuestions;
  }, [filter, reviewQuestions]);

  useEffect(() => { setCurrentIndex(0); }, [filter]);

  if (filteredQuestions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-xl text-gray-500">No questions match this filter.</p>
        <button onClick={() => setFilter('all')} className="mt-4 text-blue-600 underline">View All</button>
      </div>
    );
  }

  const currentQ = filteredQuestions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[85vh]">
      <div className="bg-white rounded-t-xl border border-gray-200 p-4 shadow-sm shrink-0 flex justify-between items-center">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium">
          <ChevronLeft className="w-5 h-5" /> Back to Results
        </button>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['all', 'correct', 'incorrect'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${filter === f ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border-x border-gray-200 p-8 flex-1 overflow-y-auto">
        <div className="mb-4 flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${currentQ.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {currentQ.isCorrect ? 'Correct' : 'Incorrect'}
          </span>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{currentQ.topic}</span>
        </div>

        <h3 className="text-xl font-medium text-gray-900 leading-relaxed mb-6">
          <span className="text-gray-400 mr-2">Q{currentQ.originalIndex + 1}.</span> 
          {currentQ.text}
        </h3>

        <div className="space-y-3 mb-8">
          {currentQ.options.map((opt, idx) => {
            const isSelected = currentQ.selected.includes(idx);
            const isActuallyCorrect = currentQ.correct.includes(idx);
            
            let borderStyle = "border-gray-200 bg-gray-50 opacity-60";
            let icon = null;

            if (isActuallyCorrect) {
              borderStyle = "border-green-500 bg-green-50";
              icon = <Check className="w-5 h-5 text-green-600 ml-auto" />;
            } else if (isSelected && !isActuallyCorrect) {
              borderStyle = "border-red-500 bg-red-50";
              icon = <X className="w-5 h-5 text-red-600 ml-auto" />;
            }

            return (
              <div key={idx} className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 ${borderStyle}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? (isActuallyCorrect ? 'border-green-600 bg-green-600' : 'border-red-600 bg-red-600') : 'border-gray-300'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
                <span className={`text-base font-medium ${isActuallyCorrect ? 'text-green-900' : (isSelected ? 'text-red-900' : 'text-gray-500')}`}>{opt}</span>
                {icon}
              </div>
            )
          })}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Explanation
          </h4>
          <p className="text-blue-800 leading-relaxed">{currentQ.explanation}</p>
        </div>
      </div>

      <div className="bg-white rounded-b-xl border border-gray-200 p-4 flex justify-between items-center shadow-sm shrink-0">
        <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Previous</button>
        <span className="text-sm font-medium text-gray-500">{currentIndex + 1} of {filteredQuestions.length}</span>
        <button onClick={() => setCurrentIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))} disabled={currentIndex === filteredQuestions.length - 1} className="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

function AnalyticsDashboard({ activeCert, setActiveCert, attempts }) {
  const certAttempts = attempts.filter(a => a.cert === activeCert);
  
  const topicAggregates = {};
  certAttempts.forEach(attempt => {
    attempt.questionResults.forEach(q => {
      if (!topicAggregates[q.topic]) topicAggregates[q.topic] = { total: 0, correct: 0 };
      topicAggregates[q.topic].total++;
      if (q.isCorrect) topicAggregates[q.topic].correct++;
    });
  });

  const weakestTopics = Object.entries(topicAggregates).map(([topic, data]) => ({
    topic,
    percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  })).sort((a, b) => a.percentage - b.percentage);

  const chartData = [...certAttempts].slice(0, 10).reverse().map((a, i) => ({
    name: `Attempt ${i + 1}`,
    score: Math.round(a.score),
    passed: a.passed
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Track your performance and identify areas for improvement.</p>
        </div>
        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex">
          {['PSM I', 'PSPO I'].map(cert => (
            <button
              key={cert}
              onClick={() => setActiveCert(cert)}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${activeCert === cert ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      {certAttempts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 shadow-sm">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No exam data available for {activeCert} yet.</p>
          <p className="text-sm mt-2">Complete an exam to see your analytics.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Score Trend</h3>
              <div className="h-64 flex items-end gap-2 relative">
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 w-8">
                  <span>100</span><span>85</span><span>50</span><span>0</span>
                </div>
                <div className="absolute left-8 right-0 bottom-[85%] border-t border-dashed border-green-400 z-0"></div>
                
                <div className="ml-8 flex-1 flex items-end justify-around gap-2 h-full pb-6 z-10">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center w-full group relative">
                      <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.score}%
                      </div>
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-500 hover:opacity-80 ${d.score >= 85 ? 'bg-blue-500' : 'bg-blue-300'}`}
                        style={{ height: `${d.score}%` }}
                      ></div>
                      <span className="text-[10px] text-gray-400 mt-2 truncate w-full text-center">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Actionable Weaknesses</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {weakestTopics.slice(0, 5).map((topic, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center shrink-0">
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800">{topic.topic}</span>
                        <span className="font-bold text-red-600">{topic.percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${topic.percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Attempt History</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-500">
                 <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                   <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Exam</th>
                     <th className="px-6 py-4">Score</th>
                     <th className="px-6 py-4">Result</th>
                     <th className="px-6 py-4">Time Used</th>
                   </tr>
                 </thead>
                 <tbody>
                   {certAttempts.map((a) => (
                     <tr key={a.id} className="bg-white border-b hover:bg-gray-50">
                       <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                         {new Date(a.date).toLocaleDateString()} {new Date(a.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </td>
                       <td className="px-6 py-4">{a.examTitle}</td>
                       <td className="px-6 py-4 font-bold">{a.score.toFixed(1)}%</td>
                       <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {a.passed ? 'PASSED' : 'FAILED'}
                         </span>
                       </td>
                       <td className="px-6 py-4">{Math.floor(a.timeUsed / 60)}m {a.timeUsed % 60}s</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportSection({ user }) {
  const isAdmin = user?.is_admin;
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [certFilter, setCertFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');

  useEffect(() => {
    const endpoint = isAdmin ? '/api/admin/attempts' : '/api/attempts';
    apiFetch(endpoint)
      .then(data => setAllAttempts(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const filtered = allAttempts.filter(a => {
    const matchesCert = certFilter === 'All' || a.cert === certFilter;
    const matchesResult = resultFilter === 'All' || (resultFilter === 'Passed' ? a.passed : !a.passed);
    const term = search.toLowerCase();
    const matchesSearch = a.examTitle?.toLowerCase().includes(term) ||
                          a.cert?.toLowerCase().includes(term) ||
                          (isAdmin && a.userEmail?.toLowerCase().includes(term));
    return matchesCert && matchesResult && matchesSearch;
  });

  const avgScore = filtered.length > 0 ? filtered.reduce((s, a) => s + a.score, 0) / filtered.length : 0;
  const passCount = filtered.filter(a => a.passed).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? 'All users\' exam submissions from the database.' : 'Your exam submissions saved in the database.'}
          </p>
        </div>
        {isAdmin && (
          <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wide">Admin View</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', val: filtered.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Passed', val: passCount, color: 'bg-green-50 text-green-600' },
          { label: 'Failed', val: filtered.length - passCount, color: 'bg-red-50 text-red-600' },
          { label: 'Avg Score', val: `${avgScore.toFixed(1)}%`, color: 'bg-yellow-50 text-yellow-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
            <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full self-start ${s.color}`}>{s.label}</span>
            <span className="text-3xl font-bold text-gray-900 mt-1">{s.val}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder={isAdmin ? 'Search user, exam or cert...' : 'Search exam or cert...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[160px]"
        />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['All', 'PSM I', 'PSPO I'].map(c => (
            <button key={c} onClick={() => setCertFilter(c)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${certFilter === c ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['All', 'Passed', 'Failed'].map(r => (
            <button key={r} onClick={() => setResultFilter(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${resultFilter === r ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No submissions found.</p>
            <p className="text-sm mt-1">Complete an exam to see results here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">#</th>
                  {isAdmin && <th className="px-5 py-3">User</th>}
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Exam</th>
                  <th className="px-5 py-3">Cert</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Correct</th>
                  <th className="px-5 py-3">Time Used</th>
                  <th className="px-5 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">{i + 1}</td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-gray-700 font-medium max-w-[160px] truncate" title={a.userEmail}>
                        {a.userEmail}
                      </td>
                    )}
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString()}<br />
                      <span className="text-xs text-gray-400">{new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">{a.examTitle}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{a.cert}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">{a.score.toFixed(1)}%</td>
                    <td className="px-5 py-4 text-gray-600">{a.correctCount}/{Q_PER_EXAM}</td>
                    <td className="px-5 py-4 text-gray-600">{Math.floor(a.timeUsed / 60)}m {a.timeUsed % 60}s</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserList({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    apiFetch('/api/admin/users')
      .then(data => setUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleAdmin = async (userId) => {
    setToggling(userId);
    try {
      const result = await apiFetch(`/api/admin/users/${userId}/toggle-admin`, { method: 'PATCH' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: result.is_admin } : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">View all registered users and manage admin roles.</p>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wide">Admin Only</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', val: users.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Admins', val: users.filter(u => u.is_admin).length, color: 'bg-purple-50 text-purple-600' },
          { label: 'Regular Users', val: users.filter(u => !u.is_admin).length, color: 'bg-gray-50 text-gray-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
            <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full self-start ${s.color}`}>{s.label}</span>
            <span className="text-3xl font-bold text-gray-900 mt-1">{s.val}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Attempts</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u, i) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {u.email}
                      {u.id === currentUserId && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_admin
                        ? <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold w-fit"><ShieldCheck className="w-3 h-3" /> Admin</span>
                        : <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold w-fit"><User className="w-3 h-3" /> User</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.attempt_count}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {u.id === currentUserId ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <button
                          onClick={() => handleToggleAdmin(u.id)}
                          disabled={toggling === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${u.is_admin ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                        >
                          {u.is_admin ? <><ShieldOff className="w-3.5 h-3.5" /> Revoke Admin</> : <><ShieldCheck className="w-3.5 h-3.5" /> Make Admin</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}