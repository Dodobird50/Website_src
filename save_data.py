import json
from datetime import datetime
def save_data(today_date: datetime, all_data, cases_data_anomalies, deaths_data_anomalies, pretty=False):
	if pretty:
		with open("data/data.json", "w") as file:
			def print_file(str):
				print(str, file=file)
			print_file("{")
			print_file('\t"data": [')
			for day_data in all_data:
				print_file("\t\t{")
				print_file(f'\t\t\t"d": {str(day_data["d"])},')
				print_file(f'\t\t\t"n": {str(day_data["n"])},')
				if day_data == all_data[-1]:
					print_file(f'\t\t\t"t": {str(day_data["t"])},')
				entries = day_data["e"]
				print_file('\t\t\t"e": [')
				for i, entry in enumerate(entries):
					state = entry[0]
					cases = entry[1]
					cases_per_100000 = entry[2]
					deaths = entry[3]
					if i < len(entries) - 1:
						print_file(f'\t\t\t\t["{state}", {cases}, {cases_per_100000}, {deaths}],')
					else:
						print_file(f'\t\t\t\t["{state}", {cases}, {cases_per_100000}, {deaths}]')
				print_file("\t\t\t]")
			
				if day_data != all_data[-1]:
					print_file("\t\t},")
				else:
					print_file("\t\t}")

			print_file("\t],")

			print_file('\t"cases_data_anomalies": {')
			i = 0
			for state_abbreviation, anomalies in cases_data_anomalies.items():
				print_file(f'\t\t"{state_abbreviation}": {{')
				j = 0
				for date, data in anomalies.items():
					omit_from_daily_average = 'true' if data[0] else 'false'
					adjusted_seven_day_average = data[1]
					if j < len(anomalies) - 1:
						print_file(f'\t\t\t"{date}": [{omit_from_daily_average}, {adjusted_seven_day_average}],')
					else:
						print_file(f'\t\t\t"{date}": [{omit_from_daily_average}, {adjusted_seven_day_average}]')
					j += 1

				if i < len(cases_data_anomalies) - 1:
					print_file('\t\t},')
				else:
					print_file('\t\t}')
				i += 1
			print_file("\t},")

			print_file('\t"deaths_data_anomalies": {')
			i = 0
			for state_abbreviation, anomalies in deaths_data_anomalies.items():
				print_file(f'\t\t"{state_abbreviation}": {{')
				j = 0
				for date, data in anomalies.items():
					omit_from_daily_average = 'true' if data[0] else 'false'
					adjusted_seven_day_average = data[1]
					if j < len(anomalies) - 1:
						print_file(f'\t\t\t"{date}": [{omit_from_daily_average}, {adjusted_seven_day_average}],')
					else:
						print_file(f'\t\t\t"{date}": [{omit_from_daily_average}, {adjusted_seven_day_average}]')
					j += 1

				if i < len(cases_data_anomalies) - 1:
					print_file('\t\t},')
				else:
					print_file('\t\t}')
				i += 1
			print_file("\t}")

			print_file("}")
	else:
		out = dict(data=all_data, cases_data_anomalies=cases_data_anomalies, deaths_data_anomalies=deaths_data_anomalies)
		with open("data/data.json", "w") as file:
			json.dump(out, fp=file)

	with open("data/last-updated.txt", "w") as file:
		print(today_date.timestamp(), file=file)