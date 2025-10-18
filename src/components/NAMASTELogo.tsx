const NAMASTELogo = ({ className = "text-4xl font-bold", showSubtext = true }: { className?: string; showSubtext?: boolean }) => {
  return (
    <div className="flex flex-col items-center text-center space-y-1">
      <h1 className={`${className} text-white font-bold tracking-wide`}>
        NAMASTE
      </h1>
      {showSubtext && (
        <p className="text-sm text-muted-foreground/70 font-medium">
          Traditional Medicine Terminology Service
        </p>
      )}
    </div>
  );
};

export default NAMASTELogo;