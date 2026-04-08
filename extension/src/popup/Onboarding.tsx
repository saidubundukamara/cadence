import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { setOnboarded, setDefaultBoardId } from "@/lib/onboarding"
import { StepWelcome } from "./onboarding/StepWelcome"
import { StepHowToSave } from "./onboarding/StepHowToSave"
import { StepFirstBoard } from "./onboarding/StepFirstBoard"

interface OnboardingProps {
  onDone: () => void
}

const STEPS = 3

export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)

  async function finish() {
    if (selectedBoardId) {
      await setDefaultBoardId(selectedBoardId)
    }
    await setOnboarded()
    onDone()
  }

  async function skip() {
    await setOnboarded()
    onDone()
  }

  const isLast = step === STEPS - 1
  const progress = ((step + 1) / STEPS) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-[520px] flex-col p-5"
    >
      {/* Header: progress + skip */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <Progress value={progress} />
          <div className="mt-1.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
            Step {step + 1} of {STEPS}
          </div>
        </div>
        <button
          onClick={skip}
          className="text-[11px] font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Step body */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && <StepWelcome />}
            {step === 1 && <StepHowToSave />}
            {step === 2 && (
              <StepFirstBoard
                selectedBoardId={selectedBoardId}
                onSelect={setSelectedBoardId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {isLast ? (
          <Button onClick={finish} size="sm" className="gap-1.5">
            <Check className="size-4" />
            Finish
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)} size="sm" className="gap-1">
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
