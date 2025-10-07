import { motion } from "framer-motion";

type Props = { onLogin: (name: string) => void };

export default function GoogleLogin({ onLogin }: Props) {
  return (
    <div className="flex flex-col items-center justify-center mt-12">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-12 max-w-md w-full"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-patriotGold/30 to-green-400/30 rounded-full blur-2xl"
            />
            <img
              src="/gmu-logo.png"
              alt="GMU"
              className="relative w-24 h-24 rounded-2xl shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-3">
            Welcome, Patriot! 🎓
          </h2>
          <p className="text-white/70 text-lg">
            Start your journey to mastering AI prompting
          </p>
        </motion.div>

        {/* Sign In Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onLogin("Patriot Student")}
          className="w-full bg-gradient-to-r from-patriotGreen to-green-600 hover:from-patriotGreen hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 group"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <img
              src="/gmu-logo.png"
              alt="GMU"
              className="w-6 h-6 rounded-lg"
            />
          </motion.div>
          <span className="text-lg">Get Started</span>
          <motion.span
            initial={{ x: 0 }}
            whileHover={{ x: 5 }}
            className="text-xl"
          >
            →
          </motion.span>
        </motion.button>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 space-y-3"
        >
          {["✨ AI-Powered Prompt Refinement", "📚 Learn Best Practices", "🚀 Instant Feedback"].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="flex items-center gap-3 text-white/80"
            >
              <div className="w-2 h-2 bg-patriotGold rounded-full"></div>
              <span className="text-sm">{feature}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
