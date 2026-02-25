import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useMatchingStore } from "../store/useMatchingStore";
import { useNavigate } from "react-router";
import { LoaderIcon, SparklesIcon, CheckIcon } from "lucide-react";
import BorderAnimatedContainer from "../components/BorderAnimated";

const INTEREST_ICONS = {
  music: "🎵",
  gaming: "🎮",
  sports: "⚽",
  travel: "✈️",
  art: "🎨",
  food: "🍜",
  technology: "💻",
  movies: "🎬",
  fitness: "💪",
  reading: "📚",
};

function OnboardingPage() {
  const [selected, setSelected] = useState([]);
  const { authUser, checkAuth } = useAuthStore();
  const { interests, fetchInterests, onboard, isOnboarding, isLoadingInterests } = useMatchingStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const toggle = (interest) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    try {
      await onboard(selected);
      // Re-check auth so authUser.onboarded updates to true
      await checkAuth();
      navigate("/");
    } catch (err) {
      // error already toasted in store
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900">
      <div className="relative w-full max-w-2xl">
        <BorderAnimatedContainer>
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <SparklesIcon className="w-8 h-8 text-cyan-400" />
                <h1 className="text-3xl font-bold text-slate-200">
                  What are you into?
                </h1>
              </div>
              <p className="text-slate-400 text-base">
                Pick your interests and we'll find people who share them.
                <br />
                <span className="text-slate-500 text-sm">Select as many as you like.</span>
              </p>
            </div>

            {/* Interest Grid */}
            {isLoadingInterests ? (
              <div className="flex justify-center py-12">
                <LoaderIcon className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
                {interests.map((interest) => {
                  const isSelected = selected.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggle(interest)}
                      className={`
                        relative flex items-center gap-3 px-4 py-4 rounded-xl border text-left
                        transition-all duration-200 cursor-pointer group
                        ${isSelected
                          ? "border-cyan-500 bg-cyan-500/10 text-slate-200"
                          : "border-slate-600/50 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl">{INTEREST_ICONS[interest]}</span>
                      <span className="capitalize font-medium text-sm">{interest}</span>

                      {/* Checkmark */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                          <CheckIcon className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected count */}
            <div className="text-center mb-6">
              <p className="text-slate-500 text-sm">
                {selected.length === 0
                  ? "No interests selected yet"
                  : `${selected.length} interest${selected.length > 1 ? "s" : ""} selected`}
              </p>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={selected.length === 0 || isOnboarding}
              className={`
                w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200
                ${selected.length === 0
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-900 cursor-pointer"
                }
              `}
            >
              {isOnboarding ? (
                <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Find My People →"
              )}
            </button>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default OnboardingPage;