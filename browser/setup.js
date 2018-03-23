
$('#setupColor').keyup(updateColor);
$('#setupColor').change(updateColor);

function updateColor() {
    let color = $('#setupColor').val();

    $('.btn').css('background-color', color);
    $('.btn').css('border-color', color);
}

