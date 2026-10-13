[.[] | select((.properties.status // "") as $status |
  ($status != "Succeeded" and $status != "Failed" and $status != "Cancelled" and $status != "Stopped"))] | length
