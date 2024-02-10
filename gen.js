// Patterns that start with a foot, and the next one starts with the left arrow
const nextArrowLeftPatterns = ['LDUR', 'LUDR', 'RUDUR', 'RDUDR', 'RUR', 'RDR']
// Patterns that start with a foot, and the next one starts with the right arrow
const nextArrowRightPatterns = ['RUDL', 'RDUL', 'LDUDL', 'LUDUL', 'LUL', 'LDL']
// Patterns that start with left
const startFromLeftPatterns = {'LDUR' : 29, 'LUDR' : 29, 'LDUDL' : 3, 'LUDUL' : 3, 'LUL' : 18, 'LDL' : 18}
// Yeah
const startFromRightPatterns = {'RUDL' : 29, 'RDUL' : 29, 'RUDUR' : 3, 'RDUDR' : 3, 'RUR' : 18, 'RDR' : 18 }

const arrowsDict = {'L' : '1000', 'D' : '0100', 'U' : '0010', 'R' : '0001'}
// Last N patterns (3 for now). If a pattern to be added is in this list, it is discarded
var lastPatterns = ['X', 'X', 'X']	// Initialize with dummy values. Make part of StreamBlock?

function generateStream(measures, quantization = 16)
{
	// Right now it only creates a list of arrows, will turn it to measures/, later, strem class etc
	stream = new StreamBlock(measures, quantization);

	// Need to generate measures * quantization arrows. Doesn't have to be precise, not a problem if it generates more than needed
	arrowsToGenerate = measures * quantization;

	addPattern(true, stream);

	while (arrowsToGenerate > 0)
	{
		stream = addPattern(1, stream);	// if 0 candle, if 1 2 3 4 no
		//stream = addPattern(Math.floor(Math.random() * 5), stream);	// if 0 candle, if 1 2 3 4 no
		arrowsToGenerate -= stream.lastPattern.length;
	}

	console.log(stream);
	return stream;
}

function addPattern(isNotCandle = true, stream)	// Passs stream object, keep "lastPattern" in stream class? TODO
{
	console.log("adding pattern ");
	if (isNotCandle)
	{
		do {
			pattern = chooseNextPattern((stream.nextArrow == 'L') ? startFromLeftPatterns : startFromRightPatterns)	
		} while (lastPatterns.includes(pattern))
	}

	else	// isNotCandle is not zero
	{
		console.log("candle");
		var secondToLastArrow = stream.lastPattern.slice(-2, -1)

		if (secondToLastArrow == 'U')
			stream.arrows.push(arrowsDict['D']);
		
		if (secondToLastArrow == 'D')
			stream.arrows.push(arrowsDict['U']);

		if (nextArrowLeftPatterns.includes(stream.lastPattern))
		{
			do {
				pattern = chooseNextPattern(startFromRightPatterns);
				console.log(pattern[1]);
			} while (pattern[1] == 'U' || lastPatterns.includes(pattern));
			// I dont want that the chosen pattern has D as second arrow
		}
		
		else if (nextArrowRightPatterns.includes(stream.lastPattern))
		{
			do {
				pattern = chooseNextPattern(startFromLeftPatterns);
			// I dont want that the chosen pattern has U as second arrow
			} while (pattern[1] == 'D' || lastPatterns.includes(pattern));
		}


	}

	stream.lastPattern = pattern;

	lastPatterns.unshift(pattern);
	lastPatterns.pop(); // Keep the list with the same amount of elements

	console.log(pattern);

	(pattern.slice(-1) == 'R') ? stream.nextArrow = 'L' : stream.nextArrow = 'R';

	convertPatternToList(pattern).forEach(arrow => {
		stream.arrows.push(arrow);
	});
	
	return stream;
}

function chooseNextPattern(patternDict)
{
	console.log(patternDict)
	var totalWeight = 100;
	var num = Math.floor(Math.random() * (totalWeight - 1));

	for (const [pattern, weight] of Object.entries(patternDict))
	{
		if (num < weight) return pattern;

		num -= weight;
	}
}

// Converts "LUDL" to ["1000", "0100", "0010", "0001"]
function convertPatternToList(pattern)
{
	var list = [];

	for (const arrow of pattern)
	{
		console.log(arrowsDict[arrow]);
		list.push(arrowsDict[arrow])
	}

	return list;
}


function getNewChart(stream, streamBegin, streamEnd, inputLines)
{
	var outputLines = [];

	streamLineCounter = 0
	var isStreamAdded = false
	console.log(stream.addCommas())

	inputLines.forEach((line, i) => {
		
		if (i < streamBegin || i > (streamEnd + 1))
		{
			outputLines.push(line)
		}

		else if (!isStreamAdded)
		{
			// add stream
			stream.addCommas().forEach((line, j) => {
				outputLines.push(line)
			});
			isStreamAdded = true;
		}
	});

	return outputLines.join("\n");
	// turn outputlines into file, output.sm
}

function main(chart)
{
	console.log(chart)
	do {
		noMoreStreams = true;
		lines = chart.split('\n');	// List of strings, each one is a line

		var streamCounter = 0, streamBegin = 0, streamEnd = 0, insideStream = false;
		for (const [i, line] of lines.entries())
		{		
			if (line == "2222")	// Start of quad hold
			{
				noMoreStreams = false;
				insideStream = true;
				streamCounter += 1;
				streamBegin = i;
			}

			if (insideStream)
			{
				console.log("processing line", line);

				if (line == "0000")
				{
					streamCounter += 1;
				}

				if (line == "3333")
				{
					streamEnd = i;
					insideStream = false;
					break;
				}
			}
		}

		measures = streamCounter / 4;

		console.log("counter : ", streamCounter)
		console.log("start st: ", streamBegin)
		console.log("end strm: ", streamEnd)
		console.log("measures: ", measures)

		stream = generateStream(measures, 16)	// Generate n measures of 16ths

		chart = getNewChart(stream, streamBegin, streamEnd, lines);
	} while (!noMoreStreams) // faking

	console.log("OUTPUT CHART");
	console.log(chart);
	var blob = new Blob([chart], { type: 'text/plain' });
	var file = new File([blob], "output.sm", {type: "text/plain"});
	
	const link = document.createElement("a");
	link.style.display = "none";
	link.href = URL.createObjectURL(file);
	link.download = file.name;
	document.body.appendChild(link);
	link.click();
}

function readFile()
{
	var chart = document.getElementById('chart').files[0]; // FileList object
	console.log(chart);

	var reader = new FileReader();

	reader.onload = (function()
	{
		return function(e)
		{
			main(e.target.result)
		};
	})(chart);

	reader.readAsText(chart);
}