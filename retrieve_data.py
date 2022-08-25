import requests
import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sys import argv
from save_data import save_data
from get_date_index import get_date_index

def date_to_tuple(date: datetime, is_end_date: bool):
	if not is_end_date:
		return (date.year, date.month, date.day)
	else:
		return (date.year, date.month, date.day, date.hour, date.minute)

def main():
	force_update = len(argv) == 2 and argv[1] == "--force"
	with open("link_states_to_abbreviations.json") as file:
		link_states_to_state_abbreviations = json.load(file)
	try:
		with open("data/data.json") as file:
			old_all_data = json.load(file)["data"]
	except:
		old_all_data = None

	all_data = {}
	cases_data_anomalies = {}
	deaths_data_anomalies = {}
	total_population = 0
	start_date = datetime(2020, 3, 1, tzinfo=ZoneInfo("America/New_York"))
	today_date = datetime.now(tz=ZoneInfo("America/New_York"))
	today_date = today_date.replace(minute=today_date.minute // 10 * 10, second=0, microsecond=0)
	if not force_update and old_all_data is not None and today_date.timestamp() == old_all_data[-1]["t"]:
		print("Retrieved data too soon after the last time data was retrieved")
		return False
	elif not force_update and today_date.hour >= 4 and today_date.hour < 21:
		print("Retrieved data too early in the day")
		return False

	date = start_date
	while date <= today_date:
		if date.year == today_date.year and date.month == today_date.month and date.day == today_date.day:
			date_tuple = date_to_tuple(today_date, True)
		else:
			date_tuple = date_to_tuple(date, False)
		all_data[date_tuple] = dict(d=list(date_tuple), n=[0, 0, 0], e={})
		date += timedelta(days=1)

	for i, link_state in enumerate(link_states_to_state_abbreviations):
		url = f"https://static01.nyt.com/newsgraphics/2021/coronavirus-tracking/data/pages/us/{link_state}-covid-cases/data.json"
		obj = json.loads(requests.get(url).text)
		cases = obj["location"]["cases"]
		deaths = obj["location"]["deaths"]
		state_population = obj["location"]["metadata"]["population"]
		total_population += state_population
		abbreviation = link_states_to_state_abbreviations[link_state]
		cases_data_anomalies[abbreviation] = []
		deaths_data_anomalies[abbreviation] = []

		start_date_str = [int(i) for i in obj["location"]["range"][0].split("-")]
		start_date = datetime(start_date_str[0], start_date_str[1], start_date_str[2], tzinfo=ZoneInfo("America/New_York"))
		date = start_date
		index = 0
		while date.month <= 2020 and date.month < 3:
			date += timedelta(days=1)
			index += 1

		while date <= today_date:
			if date.year == today_date.year and date.month == today_date.month and date.day == today_date.day:
				date_tuple = date_to_tuple(today_date, True)
			else:
				date_tuple = date_to_tuple(date, False)
			
			if index < len(cases):
				day_data = all_data[date_tuple]
				total_cases = cases[index]
				total_cases_per_100000 = round(total_cases * 100000 / state_population, 1)
				total_deaths = deaths[index]
				day_data["e"][abbreviation] = [abbreviation, total_cases, total_cases_per_100000, total_deaths]
				day_data["n"][0] += total_cases
				day_data["n"][2] += total_deaths

			date += timedelta(days=1)
			index += 1
		
		anomalies = obj["location"]["anomalies"]["date_based"]
		for anomaly in anomalies:
			# if anomaly["omit_from_rolling_average"]:
			anomaly_date = anomaly["date"].split("-")
			date_index = get_date_index(int(anomaly_date[0]), int(anomaly_date[1]), int(anomaly_date[2]))
			if anomaly["type"] in ("cases", "both"):
				cases_data_anomalies[abbreviation].append(date_index)
			if anomaly["type"] in ("deaths", "both"):
				deaths_data_anomalies[abbreviation].append(date_index)

		bar = "#" * (i + 1)
		empty = "-" * (len(link_states_to_state_abbreviations) - (i + 1))
		print(f"\rProgress: [{bar}{empty}] {i + 1} out of {len(link_states_to_state_abbreviations)} states/territories", 
			end="")
	print()
		

	all_data = sorted(list(all_data.values()), key=lambda day_data: tuple(day_data["d"]))
	for day_data in all_data[:-1]:
		num_entries = 0
		for state_abbreviation in link_states_to_state_abbreviations.values():
			if day_data["e"].get(state_abbreviation) is None:
				day_data["e"][state_abbreviation] = [state_abbreviation, 0, 0, 0]
			else:
				num_entries += 1

	today_data = all_data[-1]
	for state_abbreviation in link_states_to_state_abbreviations.values():
		if today_data["e"].get(state_abbreviation) is None:
			# Duplicate entry from yesterday
			yesterday_data = all_data[-2]
			today_data["e"][state_abbreviation] = yesterday_data["e"][state_abbreviation]
	today_data["n"][0] = sum(entry[1] for entry in today_data["e"].values())
	today_data["n"][2] = sum(entry[3] for entry in today_data["e"].values())
	today_data["t"] = today_date.timestamp()

	for day_data in all_data:
		day_data["n"][1] = round(day_data["n"][0] * 100000 / total_population, 1)
		day_data["e"] = list(day_data["e"].values())

	obj = json.loads(
		requests.get("https://static01.nyt.com/newsgraphics/2021/coronavirus-tracking/data/pages/usa/data.json").text)
	usa_anomalies = obj["location"]["anomalies"]["date_based"]
	cases_data_anomalies["USA"] = []
	deaths_data_anomalies["USA"] = []
	for anomaly in usa_anomalies:
		# if anomaly["omit_from_rolling_average"]:
		anomaly_date = anomaly["date"].split("-")
		date_index = get_date_index(int(anomaly_date[0]), int(anomaly_date[1]), int(anomaly_date[2]))
		if anomaly["type"] in ("cases", "both"):
			cases_data_anomalies["USA"].append(date_index)
		if anomaly["type"] in ("deaths", "both"):
			deaths_data_anomalies["USA"].append(date_index)


	if not force_update and old_all_data is not None and all_data[-1]["n"][0] == old_all_data[-1]["n"][0] and all_data[-1]["n"][2] == old_all_data[-1]["n"][2]:
		if len(all_data) == len(old_all_data):
			print("No change from before")
			return False

	save_data(today_date, all_data, cases_data_anomalies, deaths_data_anomalies)
	
	print("Success")
	return True

if __name__ == "__main__": main()