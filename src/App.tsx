import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useKV } from '@github/spark/hooks';

type Direction = "up" | "down" | "left" | "right";
type TestLine = {
  id: number;
  size: number;
  letters: Direction[];
  acuityLabel: string;
};

function App() {
  // State for the current test
  const [currentLine, setCurrentLine] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<Direction[]>([]);
  const [testActive, setTestActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState({ score: 0, acuity: "" });
  
  // Store best results in KV store
  const [bestScore, setBestScore] = useKV("vision-test-best-score", { score: 0, acuity: "Not tested" });
  
  // Define test lines with decreasing sizes and random directions
  const testLines: TestLine[] = [
    { id: 1, size: 200, letters: generateRandomDirections(1), acuityLabel: "20/200" },
    { id: 2, size: 160, letters: generateRandomDirections(2), acuityLabel: "20/160" },
    { id: 3, size: 125, letters: generateRandomDirections(3), acuityLabel: "20/125" },
    { id: 4, size: 100, letters: generateRandomDirections(4), acuityLabel: "20/100" },
    { id: 5, size: 80, letters: generateRandomDirections(5), acuityLabel: "20/80" },
    { id: 6, size: 63, letters: generateRandomDirections(5), acuityLabel: "20/63" },
    { id: 7, size: 50, letters: generateRandomDirections(5), acuityLabel: "20/50" },
    { id: 8, size: 40, letters: generateRandomDirections(5), acuityLabel: "20/40" },
    { id: 9, size: 32, letters: generateRandomDirections(5), acuityLabel: "20/32" },
    { id: 10, size: 25, letters: generateRandomDirections(5), acuityLabel: "20/25" },
    { id: 11, size: 20, letters: generateRandomDirections(5), acuityLabel: "20/20" },
  ];
  
  // Generate random directions for test letters
  function generateRandomDirections(count: number): Direction[] {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const result: Direction[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * directions.length);
      result.push(directions[randomIndex]);
    }
    
    return result;
  }
  
  // Handle user response to current letter
  function handleDirectionClick(direction: Direction) {
    if (!testActive) return;
    
    setUserResponses(prev => [...prev, direction]);
    
    // Check if we need to move to the next letter in current line
    const currentLineObj = testLines[currentLine];
    if (currentLetterIndex < currentLineObj.letters.length - 1) {
      setCurrentLetterIndex(currentLetterIndex + 1);
    } else {
      // Check if we need to move to the next line
      if (currentLine < testLines.length - 1) {
        setCurrentLine(currentLine + 1);
        setCurrentLetterIndex(0);
      } else {
        // End of test
        endTest();
      }
    }
  }
  
  // Start the vision test
  function startTest() {
    setTestActive(true);
    setCurrentLine(0);
    setCurrentLetterIndex(0);
    setUserResponses([]);
    setShowResults(false);
  }
  
  // End the test and calculate results
  function endTest() {
    setTestActive(false);
    
    // Calculate correct answers
    let correctCount = 0;
    let totalLetters = 0;
    let lastCorrectLine = 0;
    
    testLines.forEach((line, lineIndex) => {
      line.letters.forEach((direction, letterIndex) => {
        const responseIndex = totalLetters;
        if (userResponses[responseIndex] === direction) {
          correctCount++;
          
          // Track the last line where the user got at least 60% correct
          const lineCorrectCount = line.letters.filter((dir, idx) => 
            userResponses[totalLetters + idx] === dir
          ).length;
          
          if (lineCorrectCount >= Math.ceil(line.letters.length * 0.6)) {
            lastCorrectLine = lineIndex;
          }
        }
        totalLetters++;
      });
    });
    
    const finalAcuity = testLines[lastCorrectLine].acuityLabel;
    const finalScore = Math.round((correctCount / totalLetters) * 100);
    
    setResult({
      score: finalScore,
      acuity: finalAcuity
    });
    
    // Update best score if current is better
    if (lastCorrectLine >= testLines.findIndex(line => line.acuityLabel === bestScore.acuity)) {
      setBestScore(current => ({
        score: Math.max(current.score, finalScore), 
        acuity: testLines[lastCorrectLine].acuityLabel
      }));
    }
    
    setShowResults(true);
  }
  
  // Render the test letter with proper direction
  function renderTestLetter(direction: Direction, size: number) {
    // Creates an "E" facing the specified direction
    const letterStyle = {
      fontSize: `${size / 10}px`,
      width: `${size / 5}px`,
      height: `${size / 5}px`,
    };
    
    const getTransform = () => {
      switch (direction) {
        case "up": return "rotate(0deg)";
        case "right": return "rotate(90deg)";
        case "down": return "rotate(180deg)";
        case "left": return "rotate(270deg)";
      }
    };
    
    return (
      <div 
        className="test-letter" 
        style={{ 
          ...letterStyle, 
          transform: getTransform() 
        }}
      >
        E
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Vision Test Chart</h1>
          <p className="text-muted-foreground">
            Test your vision using the standard Snellen "E" chart
          </p>
        </header>
        
        <Card className="p-6 mb-6 text-center">
          <h2 className="text-xl font-bold mb-4">Instructions</h2>
          <p className="mb-4">
            1. Position yourself about 10 feet (3 meters) from your screen
          </p>
          <p className="mb-4">
            2. If you wear glasses for distance vision, keep them on
          </p>
          <p className="mb-4">
            3. Identify which direction each "E" is facing (up, down, left, right)
          </p>
          <p className="mb-4">
            4. Use the direction buttons to indicate your answer
          </p>
          
          {!testActive && (
            <Button onClick={startTest} className="mt-2">
              Start Vision Test
            </Button>
          )}
        </Card>
        
        {testActive && (
          <Card className="p-6 mb-6">
            <div className="snellen-chart">
              <div className="text-lg font-bold mb-4">
                Line {currentLine + 1} ({testLines[currentLine].acuityLabel})
              </div>
              
              <div className="test-line">
                {renderTestLetter(
                  testLines[currentLine].letters[currentLetterIndex],
                  testLines[currentLine].size
                )}
              </div>
              
              <div className="direction-controls">
                <Button onClick={() => handleDirectionClick("up")} variant="outline" size="lg">
                  <ArrowUp size={24} weight="bold" />
                </Button>
                <Button onClick={() => handleDirectionClick("right")} variant="outline" size="lg">
                  <ArrowRight size={24} weight="bold" />
                </Button>
                <Button onClick={() => handleDirectionClick("down")} variant="outline" size="lg">
                  <ArrowDown size={24} weight="bold" />
                </Button>
                <Button onClick={() => handleDirectionClick("left")} variant="outline" size="lg">
                  <ArrowLeft size={24} weight="bold" />
                </Button>
              </div>
              
              <div className="mt-4">
                <Button onClick={endTest} variant="secondary">End Test</Button>
              </div>
            </div>
          </Card>
        )}
        
        <Card className="p-4">
          <div className="text-center">
            <h3 className="font-medium">Best Vision Score</h3>
            <p>Acuity: {bestScore.acuity}</p>
            <p>Score: {bestScore.score}%</p>
          </div>
        </Card>
      </div>
      
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vision Test Results</DialogTitle>
            <DialogDescription>
              Here's how you performed on the vision test
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold">{result.acuity}</p>
              <p className="text-muted-foreground">Visual Acuity</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl">{result.score}%</p>
              <p className="text-muted-foreground">Accuracy</p>
            </div>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>20/20 is considered normal vision.</p>
              <p>Lower numbers indicate better vision.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              setShowResults(false);
              startTest();
            }}>
              Take Test Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;