import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from save_data import save_data

def main():
	with open("data/data.json") as file:
		json_data = json.load(file)
		all_data = json_data["data"]
		cases_data_anomalies = json_data["cases_data_anomalies"]
		deaths_data_anomalies = json_data["deaths_data_anomalies"]
	
	today_date = datetime.now(tz=ZoneInfo("America/New_York"))
	today_date = today_date.replace(minute=today_date.minute // 10 * 10, second=0, microsecond=0)
	if all_data[-1]["d"][0] == today_date.year and all_data[-1]["d"][1] == today_date.month and \
		all_data[-1]["d"][2] == today_date.day:
		# If today already exists, remove it and restore "t" key of yesterday
		all_data.pop()
		yesterday_date = datetime(all_data[-1]["d"][0], all_data[-1]["d"][1], all_data[-1]["d"][2], 
			tzinfo=ZoneInfo("America/New_York"))
		all_data[-1]["t"] = yesterday_date.timestamp()
		print("Removed today in data")
	else:
		yesterday_date = datetime(all_data[-1]["d"][0], all_data[-1]["d"][1], all_data[-1]["d"][2], 
			tzinfo=ZoneInfo("America/New_York"))
	
	yesterday_date += timedelta(days=1)
	if yesterday_date.date() != today_date.date():
		print("Cannot add today, as previous day in data does not match with yesterday")
		return False

	all_data.append(all_data[-1].copy())
	all_data[-1]["d"] = [today_date.year, today_date.month, today_date.day, today_date.hour, today_date.minute]
	all_data[-1]["t"] = today_date.timestamp()
	print("Added today to data")
	
	del all_data[-2]["t"]
	all_data[-2]["d"] = all_data[-2]["d"][:3]
	
	save_data(today_date, all_data, cases_data_anomalies, deaths_data_anomalies)
	print("Success")
	return True

if __name__ == "__main__": main()