import { useState, useEffect } from 'react';
import * as lucide from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

// Mock UI components from shadcn/ui.
const Card = ({ children, className }) => <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>{children}</div>;
const CardHeader = ({ children, className }) => <div className={`mb-4 ${className}`}>{children}</div>;
const CardTitle = ({ children, className }) => <h2 className={`text-2xl font-bold ${className}`}>{children}</h2>;
const CardDescription = ({ children, className }) => <p className={`text-gray-500 ${className}`}>{children}</p>;
const CardContent = ({ children, className }) => <div className={`space-y-4 ${className}`}>{children}</div>;
const Button = ({ children, onClick, className, disabled }) => <button onClick={onClick} className={`w-full px-4 py-3 font-semibold text-white rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={disabled}>{children}</button>;

// Translation data for different languages
const translations = {
  en: {
    appName: "MedFit + Med Assist",
    patientDashboard: "Patient Dashboard",
    symptomChecker: "Symptom Checker",
    myHealthDetails: "My Health Details",
    describeSymptoms: "Describe your symptoms",
    uploadImage: "Upload an image (Optional)",
    analyzeSymptoms: "Analyze Symptoms",
    analyzing: "Analyzing...",
    symptomAnalysis: "Symptom Analysis",
    preliminaryAssessment: "A preliminary assessment of your symptoms.",
    listenToResponse: "Listen to Response",
    generatingAudio: "Generating Audio...",
    getPrecautions: "Get Precautions",
    gettingPrecautions: "Getting Precautions...",
    urgent: "URGENT",
    precautionsAndNextSteps: "Precautions and Next Steps",
    simpleSteps: "Here are some simple steps to take.",
    logout: "Logout",
    placeholderSymptoms: "e.g., 'I have a rash on my arm that is itchy and red.'",
    triageLevel: "Triage Level:",
    callDoc: "Call a Doctor",
    nearbyHospitals: "Nearby Hospitals",
    sos: "SOS - Emergency",
    healthDetailsIntro: "Enter your health details to help us provide better care.",
    age: "Age",
    sex: "Sex",
    weight: "Weight (kg)",
    save: "Save Details",
    saving: "Saving...",
    detailsSaved: "Health details saved!",
    symptomHistory: "Symptom History",
    noHistory: "No symptom history found.",
    callingDoctor: "Calling a Doctor...",
    findingHospitals: "Finding Nearby Hospitals...",
    emergencyAlert: "Emergency! An SOS signal has been sent. Please call emergency services immediately.",
    customAlertTitle: "Notification",
    customAlertDismiss: "Dismiss",
  },
  ta: {
    appName: "மெட்ஃபிட் + மெட் அசிஸ்ட்",
    patientDashboard: "நோயாளியின் டாஷ்போர்டு",
    symptomChecker: "நோய்த்தாக்கங்களைச் சோதிப்பான்",
    myHealthDetails: "எனது உடல்நல விவரங்கள்",
    describeSymptoms: "உங்கள் அறிகுறிகளை விவரிக்கவும்",
    uploadImage: "படத்தைப் பதிவேற்றவும் (விருப்பம்)",
    analyzeSymptoms: "அறிகுறிகளை ஆய்வு செய்",
    analyzing: "ஆய்வு செய்கிறது...",
    symptomAnalysis: "அறிகுறி ஆய்வு",
    preliminaryAssessment: "உங்கள் அறிகுறிகளின் ஒரு முதற்கட்ட மதிப்பீடு.",
    listenToResponse: "பதிலைக் கேட்கவும்",
    generatingAudio: "ஆடியோ உருவாக்குகிறது...",
    getPrecautions: "முன்னெச்சரிக்கை நடவடிக்கைகளை பெறுங்கள்",
    gettingPrecautions: "முன்னெச்சரிக்கை நடவடிக்கைகளை பெறுகிறது...",
    urgent: "அவசரம்",
    precautionsAndNextSteps: "முன்னெச்சரிக்கை நடவடிக்கைகள் மற்றும் அடுத்த படிகள்",
    simpleSteps: "நீங்கள் எடுக்க வேண்டிய சில எளிய படிகள் இங்கே.",
    logout: "வெளியேறு",
    placeholderSymptoms: "உதாரணமாக, 'என் கையில் அரிப்பு மற்றும் சிவப்பாக இருக்கும் ஒரு தடிப்பு உள்ளது.'",
    triageLevel: "சிகிச்சை நிலை:",
    callDoc: "ஒரு மருத்துவரை அழைக்கவும்",
    nearbyHospitals: "அருகில் உள்ள மருத்துவமனைகள்",
    sos: "SOS - அவசரம்",
    healthDetailsIntro: "சிறந்த கவனிப்பை வழங்க உங்கள் உடல்நல விவரங்களை உள்ளிடவும்.",
    age: "வயது",
    sex: "பாலினம்",
    weight: "எடை (கிலோ)",
    save: "விவரங்களை சேமி",
    saving: "சேமிக்கிறது...",
    detailsSaved: "உடல்நல விவரங்கள் சேமிக்கப்பட்டன!",
    symptomHistory: "அறிகுறி வரலாறு",
    noHistory: "அறிகுறி வரலாறு எதுவும் இல்லை.",
    callingDoctor: "ஒரு மருத்துவரை அழைக்கிறது...",
    findingHospitals: "அருகில் உள்ள மருத்துவமனைகளைத் தேடுகிறது...",
    emergencyAlert: "அவசரம்! ஒரு SOS சிக்னல் அனுப்பப்பட்டுள்ளது. உடனடியாக அவசர சேவைக்கு அழைக்கவும்.",
    customAlertTitle: "அறிவிப்பு",
    customAlertDismiss: "நீக்கு",
  },
};

// Helper function to convert base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Helper function to convert PCM audio data to WAV format
const pcmToWav = (pcmData, sampleRate) => {
  const dataLength = pcmData.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  let offset = 0;

  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };

  writeString('RIFF'); // RIFF identifier
  view.setUint32(offset, 36 + dataLength, true); // file size
  offset += 4;
  writeString('WAVE'); // RIFF type
  writeString('fmt '); // format chunk identifier
  view.setUint32(offset, 16, true); // format chunk length
  offset += 4;
  view.setUint16(offset, 1, true); // sample format (1 = PCM)
  offset += 2;
  view.setUint16(offset, 1, true); // number of channels
  offset += 2;
  view.setUint32(offset, sampleRate, true); // sample rate
  offset += 4;
  view.setUint32(offset, sampleRate * 2, true); // byte rate
  offset += 4;
  view.setUint16(offset, 2, true); // block align
  offset += 2;
  view.setUint16(offset, 16, true); // bits per sample
  offset += 2;
  writeString('data'); // data chunk identifier
  view.setUint32(offset, dataLength, true); // data chunk length
  offset += 4;

  const pcmView = new Int16Array(buffer, offset);
  pcmView.set(pcmData);

  return new Blob([view], { type: 'audio/wav' });
};

// Custom Alert Modal Component to replace browser's alert()
const CustomAlert = ({ message, onClose, title }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75 p-4">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-700 mb-4">{message}</p>
      <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
        Dismiss
      </Button>
    </div>
  </div>
);

// Main App Component
export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userType, setUserType] = useState('patient');
  const [currentPage, setCurrentPage] = useState('symptomChecker');
  const [symptomText, setSymptomText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [precautionsResponse, setPrecautionsResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrecautionsLoading, setIsPrecautionsLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');

  // New states for health details and custom alert
  const [healthDetails, setHealthDetails] = useState({ age: '', sex: '', weight: '' });
  const [isHealthDetailsSaving, setIsHealthDetailsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [modalMessage, setModalMessage] = useState('');

  const t = translations[language];

  // Initialize Firebase and Auth State Listener
  useEffect(() => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

    if (Object.keys(firebaseConfig).length === 0) {
      console.error("Firebase config is not defined. Data persistence will not work.");
      return;
    }

    const app = initializeApp(firebaseConfig, 'med-assist-app');
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Sign in anonymously if no user is authenticated
        const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (initialToken) {
          try {
            await signInWithCustomToken(auth, initialToken);
          } catch (e) {
            console.error("Failed to sign in with custom token:", e);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      }
      setUserId(auth.currentUser?.uid);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Fetch health details and symptom history from Firestore
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig, 'med-assist-app');
    const db = getFirestore(app);

    // Fetch health details
    const healthDocRef = doc(db, `artifacts/${appId}/users/${userId}/health_details`, 'user_data');
    const unsubscribeHealth = onSnapshot(healthDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setHealthDetails(docSnap.data());
      } else {
        setHealthDetails({ age: '', sex: '', weight: '' });
      }
    });

    // Fetch symptom history without orderBy to prevent errors
    const historyColRef = collection(db, `artifacts/${appId}/users/${userId}/symptom_history`);
    const q = query(historyColRef);
    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      // Sort data in memory instead of in the query
      const sortedHistory = historyList.sort((a, b) => b.timestamp - a.timestamp);
      setSymptomHistory(sortedHistory);
    });

    return () => {
      unsubscribeHealth();
      unsubscribeHistory();
    };
  }, [isAuthReady, userId]);

  // Handle saving health details to Firestore
  const handleSaveHealthDetails = async () => {
    if (!userId) {
      setError("User not authenticated. Please try again.");
      return;
    }
    setIsHealthDetailsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const firebaseConfig = JSON.parse(__firebase_config);
      const app = initializeApp(firebaseConfig, 'med-assist-app');
      const db = getFirestore(app);
      const healthDocRef = doc(db, `artifacts/${appId}/users/${userId}/health_details`, 'user_data');

      await setDoc(healthDocRef, healthDetails, { merge: true });
      setSaveSuccess(true);
    } catch (e) {
      console.error("Error saving health details:", e);
      setError("Failed to save details. Please try again.");
    } finally {
      setIsHealthDetailsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
    }
  };
  
  // Handles the logout button click
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType(null);
  };

  // Handles image file selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageURL(url);
    }
  };

  // Saves a symptom analysis record to Firestore
  const saveSymptomRecord = async (analysis, precautions, imageRef) => {
    if (!userId) return;

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const firebaseConfig = JSON.parse(__firebase_config);
      const app = initializeApp(firebaseConfig, 'med-assist-app');
      const db = getFirestore(app);
      const historyColRef = collection(db, `artifacts/${appId}/users/${userId}/symptom_history`);

      await addDoc(historyColRef, {
        symptomText,
        analysis,
        precautions: precautions || null,
        timestamp: serverTimestamp(),
        imageRef: imageRef || null
      });
    } catch (e) {
      console.error("Error saving symptom history:", e);
    }
  };

  // Handles API call for symptom analysis (Text + Vision)
  const handleSymptomAnalysis = async () => {
    setIsLoading(true);
    setApiResponse(null);
    setPrecautionsResponse(null);
    setError('');

    try {
      const prompt = `Analyze the following symptoms and provide a general overview of possible conditions. Based on the symptoms, classify the urgency level as "Normal" or "Urgent". If urgent, provide a clear recommendation to see a doctor immediately. The analysis should be concise and easy to understand.`;
      const parts = [{ text: `${prompt} Symptoms: "${symptomText}"` }];
      let base64Data = null;

      if (imageFile) {
        const reader = new FileReader();
        const readPromise = new Promise((resolve) => {
          reader.onloadend = () => {
            base64Data = reader.result.split(',')[1];
            parts.push({
              inlineData: {
                mimeType: imageFile.type,
                data: base64Data,
              },
            });
            resolve();
          };
          reader.readAsDataURL(imageFile);
        });
        await readPromise;
      }
      await performAnalysisApiCall(parts, base64Data);

    } catch (e) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const performAnalysisApiCall = async (parts, base64Data) => {
    const payload = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            triage_level: { type: "STRING", enum: ["Normal", "Urgent"] },
            analysis: { type: "STRING" },
            recommendation: { type: "STRING" }
          },
        }
      },
    };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const parsedResponse = JSON.parse(content);
        setApiResponse(parsedResponse);
        await saveSymptomRecord(parsedResponse, null, base64Data ? `data:${imageFile.type};base64,...` : null);
      } else {
        setError('No structured response from the API. Please try again.');
      }
    } catch (e) {
      setError('Network error or API call failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handles API call for precautions
  const handleGetPrecautions = async () => {
    if (!apiResponse) return;
    setIsPrecautionsLoading(true);
    setError('');

    try {
      const prompt = `Based on the following analysis, provide a short, numbered list of simple precautions or next steps to take. Do not include any medical jargon. Analysis: "${apiResponse.analysis}"`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: { type: "STRING" },
          }
        },
      };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const precautions = JSON.parse(content);
        setPrecautionsResponse(precautions);
        console.log("Precautions received and would be saved:", precautions);
      } else {
        setError('Could not get precautions. Please try again.');
      }
    } catch (e) {
      setError('Network error or API call failed for precautions.');
    } finally {
      setIsPrecautionsLoading(false);
    }
  };

  // Handles API call for TTS (Text-to-Speech)
  const handleTTS = async () => {
    if (!apiResponse) {
      setError('Please get an analysis first before listening.');
      return;
    }
    setAudioLoading(true);
    setError('');
    
    const textToSpeak = `${apiResponse.analysis}. ${apiResponse.recommendation}`;
    
    const payload = {
        contents: [{
            parts: [{ text: textToSpeak }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Puck" }
                }
            }
        },
    };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/")) {
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 16000;
            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            const wavBlob = pcmToWav(pcm16, sampleRate);
            const url = URL.createObjectURL(wavBlob);
            const audio = new Audio(url);
            audio.play();
        } else {
            setError("Could not generate audio. Please try again.");
        }
    } catch (e) {
        setError("Audio generation failed due to a network or API error.");
    } finally {
        setAudioLoading(false);
    }
  };

  // Component for the Patient's Home page
  const PatientHomePage = () => (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center font-sans antialiased">
      {modalMessage && <CustomAlert message={modalMessage} onClose={() => setModalMessage('')} title={t.customAlertTitle} />}
      <div className="w-full max-w-4xl">
        <header className="flex justify-between items-center mb-6 py-4 px-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl font-extrabold text-blue-700 flex items-center">
            <lucide.HeartPulse className="mr-3 w-8 h-8 text-red-500" />
            {t.appName}
          </h1>
          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
            </select>
            <Button onClick={handleLogout} className="w-auto px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
              <lucide.LogOut className="mr-2 h-4 w-4" />
              {t.logout}
            </Button>
          </div>
        </header>

        <div className="flex justify-center space-x-4 mb-6">
          <Button 
            onClick={() => setCurrentPage('symptomChecker')} 
            className={`w-1/2 ${currentPage === 'symptomChecker' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            {t.symptomChecker}
          </Button>
          <Button 
            onClick={() => setCurrentPage('healthDetails')} 
            className={`w-1/2 ${currentPage === 'healthDetails' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            {t.myHealthDetails}
          </Button>
        </div>

        {currentPage === 'symptomChecker' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.patientDashboard}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Button onClick={() => setModalMessage(t.callingDoctor)} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md">
                <lucide.Phone className="mr-2 h-5 w-5" /> {t.callDoc}
              </Button>
              <Button onClick={() => setModalMessage(t.findingHospitals)} className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md">
                <lucide.MapPin className="mr-2 h-5 w-5" /> {t.nearbyHospitals}
              </Button>
              <Button onClick={() => setModalMessage(t.emergencyAlert)} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md">
                <lucide.TriangleAlert className="mr-2 h-5 w-5" /> {t.sos}
              </Button>
            </div>
            <Card className="mb-6 bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>{t.symptomChecker}</CardTitle>
                <CardDescription>
                  {t.preliminaryAssessment}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.describeSymptoms}
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      value={symptomText}
                      onChange={(e) => setSymptomText(e.target.value)}
                      placeholder={t.placeholderSymptoms}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.uploadImage}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                    />
                    {imageURL && (
                      <div className="mt-4">
                        <img src={imageURL} alt="Preview" className="w-48 h-48 rounded-xl object-cover" />
                      </div>
                    )}
                  </div>
                  
                  {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                  <Button onClick={handleSymptomAnalysis} disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-xl">
                    {isLoading ? (
                      <lucide.Loader2 className="animate-spin mr-2" />
                    ) : (
                      <lucide.Microscope className="mr-2" />
                    )}
                    {isLoading ? t.analyzing : t.analyzeSymptoms}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {apiResponse && (
              <Card className={`mb-6 border-4 ${apiResponse.triage_level === 'Urgent' ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400'}`}>
                <CardHeader>
                  <CardTitle className={`${apiResponse.triage_level === 'Urgent' ? 'text-red-700' : 'text-green-700'}`}>
                    {t.symptomAnalysis}: {apiResponse.triage_level}
                  </CardTitle>
                  <CardDescription>
                    {t.preliminaryAssessment}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {apiResponse.analysis}
                  </p>
                  {apiResponse.triage_level === 'Urgent' && (
                    <div className="flex items-start p-4 bg-red-500 text-white rounded-lg">
                      <lucide.AlertCircle className="flex-shrink-0 w-6 h-6 mr-3 mt-1" />
                      <p className="font-bold">
                        {t.urgent}: {apiResponse.recommendation}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <Button onClick={handleTTS} disabled={audioLoading} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-xl">
                      {audioLoading ? (
                        <lucide.Loader2 className="animate-spin mr-2" />
                      ) : (
                        <lucide.Headphones className="mr-2" />
                      )}
                      {audioLoading ? t.generatingAudio : t.listenToResponse}
                    </Button>
                    <Button onClick={handleGetPrecautions} disabled={isPrecautionsLoading} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-xl">
                      {isPrecautionsLoading ? (
                        <lucide.Loader2 className="animate-spin mr-2" />
                      ) : (
                        <lucide.ClipboardList className="mr-2" />
                      )}
                      {isPrecautionsLoading ? t.gettingPrecautions : t.getPrecautions}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {precautionsResponse && (
              <Card className="mb-6 bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>{t.precautionsAndNextSteps}</CardTitle>
                  <CardDescription>
                    {t.simpleSteps}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-gray-800">
                    {precautionsResponse.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <lucide.CheckCircle className="flex-shrink-0 w-5 h-5 mr-2 mt-1 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {currentPage === 'healthDetails' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.myHealthDetails}</h2>
            <Card className="mb-6 bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>{t.healthDetailsIntro}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.age}</label>
                    <input 
                      type="number"
                      value={healthDetails.age || ''}
                      onChange={(e) => setHealthDetails({ ...healthDetails, age: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.sex}</label>
                    <input 
                      type="text"
                      value={healthDetails.sex || ''}
                      onChange={(e) => setHealthDetails({ ...healthDetails, sex: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.weight}</label>
                    <input 
                      type="number"
                      value={healthDetails.weight || ''}
                      onChange={(e) => setHealthDetails({ ...healthDetails, weight: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button onClick={handleSaveHealthDetails} disabled={isHealthDetailsSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                    {isHealthDetailsSaving ? t.saving : t.save}
                  </Button>
                  {saveSuccess && <p className="text-sm font-medium text-green-500">{t.detailsSaved}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>{t.symptomHistory}</CardTitle>
                <CardDescription>A record of your past symptom analyses.</CardDescription>
              </CardHeader>
              <CardContent>
                {symptomHistory.length > 0 ? (
                  <ul className="space-y-4">
                    {symptomHistory.map((entry, index) => (
                      <li key={index} className="p-4 border rounded-lg bg-gray-50 space-y-2">
                        <p className="font-semibold text-gray-800">{entry.timestamp?.toLocaleString() || 'N/A'}</p>
                        <p className="text-gray-600">
                          <strong>{t.describeSymptoms}:</strong> {entry.symptomText}
                        </p>
                        <p className="text-gray-600">
                          <strong>{t.symptomAnalysis}:</strong> {entry.analysis?.analysis}
                        </p>
                        <span className={`px-2 py-1 text-sm font-bold rounded-full ${entry.analysis?.triage_level === 'Urgent' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                          {t.triageLevel} {entry.analysis?.triage_level}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500">{t.noHistory}</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="font-inter antialiased">
      {isLoggedIn && isAuthReady ? (
        userType === 'doctor' ? null : <PatientHomePage />
      ) : null}
    </div>
  );
}
