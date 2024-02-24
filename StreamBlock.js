class StreamBlock {

	constructor(measures, quantization, firstArrow, firstMeasure, lastMeasure)
	{
		this.measures = measures;	// ALL measures including first and last, which may have existing arrows
		this.quantization = quantization;
		this.nextArrow = firstArrow;
		this.arrows = [];
		this.lastPatterns = ['X', 'X'];	// Last 2 patterns, initialized with dummy values. [0] is the very last
		this.firstMeasure = firstMeasure;
		this.lastMeasure = lastMeasure;
		//console.log("firstMeasure: ", firstMeasure);
		//console.log("lastMeasure: ", lastMeasure);
	}
	
	addFirstLastMeasure(measure, finalStream, count, isLastMeasure = false)
	{
		var converted, jimmy;
		[converted, jimmy] = this.convertMeasure(measure);	// Convert old measure to compatible quantization
		var write = (isLastMeasure ? true : false), lock = false, i;
		
		for (i = 0; i < converted.length; i++)
		{
			if ((converted[i] == "2222" || converted[i] == "4444") && !lock)
				write = true;
			
			if (converted[i] == "3333")
			{
				finalStream.push(this.arrows[count++]);
				i++;
				
				for (let j = 0; j < jimmy - 1; j++)		// Use jimmy because generated quantization could be different from converted quant
				{
					finalStream.push("0000");
					i++;
				}

				write = false;
				lock = true;	// can no longer write if there's another 2222/4444 after 3333 in the same measure
				break;
			}
			
			if (write)
			{
				finalStream.push(this.arrows[count++]);

				for (let j = 0; j < jimmy - 1; j++)
				{
					finalStream.push("0000");
					i++;
				}
			}

			else {
				finalStream.push(converted[i]);
			}	// No need to use jimmy because old measure is already converted

		}
		console.log("i: ", i);
		for (let j = i; j < converted.length; j++)
		{
			finalStream.push(converted[j]);	// No need to use jimmy because old measure is already converted
		}
		
		return [finalStream, count];
	}

	// Converts a measure of xths to something that can fit xths and (quantization)ths
	convertMeasure(oldMeasure)
	{
		var newMeasure = [];
		var oldQuant = oldMeasure.length;
		
		var newQuant = this.findLCM(this.quantization, oldQuant);
		
		var jimmy = newQuant / this.quantization;
		var jimmy2 = newQuant / oldQuant;
		
		console.log("jimmy: ", jimmy);
		console.log("oldQuant: ", oldQuant);
		console.log("newQuant: ", newQuant);
		
		for (let i = 0; i < oldMeasure.length; i++)
		{
			newMeasure.push(oldMeasure[i])
			
			for (let j = 0; j < jimmy2 - 1; j++)	// - 1 because the first arrow is copied from the old measure
			{
				newMeasure.push("0000");
			}
		}
		
		console.log("converted measure: ", newMeasure);
		return [newMeasure, jimmy];// Doesn't have commas
		
	}
	
	findLCM(a, b)	// x > y
	{
		var x = Math.max(a, b);
		var y = Math.min(a, b);
		
		var lcm = x;
		
		while (lcm % x > 0 || lcm % y > 0)
			lcm++;

		return lcm;
	}
	
	// Returns true if the first measure contains 3333 (only one measure of generated stream)
	isOneMeasure()
	{
		for (const arrow of this.firstMeasure)
		{
			if (arrow == "3333")
				return true;
		}
		
		return false;
	}
	
	// TODO rename
	addCommas()	// Puts the ',' every *quantization* arrows (e.g. , every 16 arrows)
	{
		var finalStream = [];
		var count = 0;
		
		[finalStream, count] = this.addFirstLastMeasure(this.firstMeasure, finalStream, count);

		if (!this.isOneMeasure())
		{
			finalStream.push(",");
			
			for (let i = 0; i < this.measures - 2; i++)	// Even if there are excess arrows, it only gives the exact measures
			{
				for (let j = 0; j < this.quantization; j++)
				{
					finalStream.push(this.arrows[count++])
				}

				finalStream.push(',');
			}
			
			[finalStream, count] = this.addFirstLastMeasure(this.lastMeasure, finalStream, count, true);
		}
		
		return finalStream;
	}
}
