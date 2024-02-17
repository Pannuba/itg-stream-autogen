class StreamBlock {

	constructor(measures, quantization, firstArrow, firstMeasure, lastMeasure)
	{
		this.measures = measures;	// ALL measures including first and last, which may be skipped
		this.quantization = quantization;
		this.nextArrow = firstArrow;
		this.arrows = [];
		this.lastPattern = null;
		this.firstMeasure = firstMeasure;
		this.lastMeasure = lastMeasure;
		console.log("firstMeasure: ", firstMeasure);
		console.log("lastMeasure: ", lastMeasure);
	}
	
	//BUG if converted measure is not same quantization as stream to add, everything screws up
	addFirstLastMeasure(measure, finalStream, count, isLastMeasure = false)
	{
		var converted = this.convertMeasure(measure)
		var write = (isLastMeasure ? true : false), lock = false;
		
		for (let i = 0; i < converted.length; i++)
		{
			if ((converted[i] == "2222" || converted[i] == "4444") && !lock)
				write = true;
			
			if (converted[i] == "3333")
			{
				finalStream.push(this.arrows[count++]);
				i++;
				write = false;
				lock = true;	// can no longer write if there's another 2222/4444 after 3333 in the same measure
			}
			
			if (write)
				finalStream.push(this.arrows[count++]);
			
			else finalStream.push(converted[i]);
		}
		
		// TODO check commas include/exclude, indexes etc
		
		return [finalStream, count];
	}
	
	// Converts a measure of xths to something that can fit xths and (quantization)ths
	// 16ths and 24ths --> 48ths
	// 16ths and 12ths --> 48ths
	// TODO if 8ths and add 16ths ok, but if 16ths and add 8ths NOT OK
	convertMeasure(oldMeasure)
	{
		var newMeasure = [];
		var oldQuant = oldMeasure.length;
		
		var newQuant = this.findLCM(this.quantization, oldQuant);
		
		var jimmy = newQuant / oldQuant;
		// TODO maybe jimmy = newquant / this.quant; so if i put 8ths in 16thsM its 2
		// todo write stream in this function!!! deleteaddfirstlast
		// If i put 8ths in 16ths measure,  jimmy is 16/16 = 1
		// if i put 16ths in 32nds measure, jimmy is 32/16 = 2
		// if i put 16ths in 12ths measure, jimmy is 48/12 = 4
		// Empty measure was 12ths, I want to put 16ths. newQuant is 48, jimmy is 4
		// Empty measure was 4ths, I want to put 8ths. newQuant is 8, jimmy is 2
		
		console.log("jimmy: ", jimmy);
		
		for (let i = 0; i < oldMeasure.length; i++)
		{
			newMeasure.push(oldMeasure[i])
			
			for (let j = 0; j < jimmy - 1; j++)	// - 1 because the first arrow is copied from the old measure
			{
				newMeasure.push("0000");
			}
		}
		
		console.log("converted measure: ", newMeasure);
		return newMeasure;// Doesn't have commas
		
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
