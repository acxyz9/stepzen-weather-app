import { getClient } from "@/apollo-client";
import InfiniteScroll from "@/components/InfiniteScroll";
import fetchAirQualityIndexQuery from "@/graphQL/fetchAirQualityIndexQuery";
import fetchNewsQuery from "@/graphQL/fetchNewsQuery";
import sortNews from "@/helper/sortNews";

type Props = {
  params: {
    city: string;
    lat: string;
    long: string;
    country: string;
    category: string;
  };
};
async function News({ params: { city, lat, long, country, category } }: Props) {
  console.log(lat, long, country, category);

  const client = getClient();
  const {
    data: { aqiQuery },
  } = await client.query({
    query: fetchAirQualityIndexQuery,
    variables: {
      current: "european_aqi,us_aqi,dust",
      longitude: `${long}`,
      latitude: `${lat}`,
      timezone: "auto",
    },
  });

  const aqiResult: AirQualityIndex = aqiQuery;

  if (!process.env.MEDIASTACK_API_KEY) {
    throw new Error("MEDIASTACK_API_KEY is not set");
  }

  if (!process.env.STEPZEN_API_KEY) {
    throw new Error("STEPZEN_API_KEY is not set");
  }

  const response = await fetch(
    "https://villadeleyva.stepzen.net/api/tinseled-butterfly/__graphql",
    {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `apikey ${process.env.STEPZEN_API_KEY}`,
      },
      body: JSON.stringify({
        query: fetchNewsQuery,
        variables: {
          access_key: process.env.MEDIASTACK_API_KEY,
          categories: category,
          countries: country,
          limit: "50",
          offset: "0",
          languages: "en",
        },
      }),
    }
  );

  const { data } = await response.json();

  const news = sortNews(data.newsQuery.data);

  const pagination: NewsPagination = data.newsQuery.pagination;
  console.log(data);

  if (news.length > 0) {
    return (
      <>
        <InfiniteScroll
          country={country}
          category={category}
          utcOffsetSeconds={aqiResult.utc_offset_seconds}
          data={news}
          pagination={pagination}
        />
      </>
    );
  } else {
    return (
      <div className="flex items-center justify-center text-xl text-gray-500">
        No live news at the moment.
      </div>
    );
  }
}

export default News;
