from datetime import datetime, timedelta
def get_date_index(year, month, day):
	start = datetime(2020, 3, 1)
	final = datetime(year, month, day)
	count = 0
	while start < final:
		start += timedelta(days=1)
		count += 1
	
	return count